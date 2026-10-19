# Case study: a client-side navigation race

How a flaky test was diagnosed from Playwright trace evidence instead of being retried.

## Symptom

The first live E2E run of the rebuilt CI pipeline, on commit `47c7d17`, [failed one scenario out of twelve](https://github.com/RolanV/ZincBank/actions/runs/39331177043):

```text
Failed scenarios:
  1) User can navigate to account creation page # features/authentication/zinc-bank-login.feature:67
       Then the user should be redirected to the account creation page # steps/authentication/login.steps.ts:146
           Error: expect(received).toBeTruthy()

           Received: false
               at CustomWorld.<anonymous> (steps/authentication/login.steps.ts:154:27)

12 scenarios (11 passed, 1 failed)
```

`Received: false` is the entire diagnostic. No URL, no expected value, no context — a direct consequence of asserting on a boolean rather than using a web-first assertion.

## The assertion under test

```ts
const currentUrl = await loginPage.getCurrentUrl();
const isOnAccountPage =
  currentUrl.includes('signup') ||
  currentUrl.includes('register') ||
  currentUrl.includes('account') ||
  !currentUrl.includes('login');
expect(isOnAccountPage).toBeTruthy();
```

Two problems are visible before any investigation. The final clause makes the assertion true for almost any navigation away from `/login`, so it barely tests the stated requirement. And because the result collapses to a boolean, a failure carries no information.

## Narrowing it down

The link's actual destination, read from the live page:

```html
<a class="text-primary hover:underline" data-testid="login-apply-link" href="/apply">Open an account</a>
```

`/apply` returns HTTP 200. Evaluating the assertion against that URL:

| URL at assertion time | `signup` | `register` | `account` | `!login` | Result |
|---|---|---|---|---|---|
| `.../apply` | false | false | false | **true** | would pass |
| `.../login` | false | false | false | false | **fails**, matching the observation |

So the browser was still on `/login` when the URL was read. The question was about *when* the assertion ran, not *whether* navigation worked.

## Trace evidence

The failing run uploaded a Playwright trace. Action timeline:

```text
call@215   +0.000s -> +1.023s   Frame.goto         (to /login)
call@217   +1.029s -> +1.051s   Frame.expect       (heading visible)
call@219   +1.054s -> +1.086s   Frame.click        ("Open an account")
call@221   +1.094s -> +1.094s   Page.__waitInfo__  waitForLoadState, 0 ms
call@225   +1.094s -> +1.094s   Page.__waitInfo__  waitForLoadState, 0 ms
call@229   +1.094s -> +1.154s   Page.screenshot    (After-hook failure capture)
```

Frame URL timeline:

```text
+1.055s   .../login     during click
+1.088s   .../login     click completed, still on /login
+1.104s   .../apply     router committed here
+1.156s   .../apply
```

Four findings:

1. **Navigation did occur,** and in the **same tab** — the trace contains a single `pageId`, so no popup or second page was involved.
2. **The locator was correct.** The trace log reads `locator resolved to <a href="/apply" data-testid="login-apply-link" ...>`, then `performing click action` and `click action done`.
3. **Both `waitForLoadState('networkidle')` calls completed in 0 ms.** They waited for nothing.
4. **The URL changed after the assertion read it.** `page.url()` is a synchronous property read and produces no trace action, so it executed at roughly +1.094 s — inside the window of about 16 ms between the click finishing and the router committing.

## Root cause

### Observed

The network log recorded five requests to the destination path:

```text
GET /apply?_rsc=17yrj   200
GET /apply?_rsc=ty3fy   200
GET /apply?_rsc=m8m8p   200
GET /apply?_rsc=4c4j4   200
GET /apply?_rsc=8kjoi   200
```

Also directly observed: the page served `/_next/static/...` assets; both `waitForLoadState('networkidle')` calls returned in 0 ms; and the frame URL changed from `/login` to `/apply` after the assertion had already read it.

### Interpretation

What follows is inferred from that evidence rather than directly measured. The `_rsc` query parameter and the `/_next/` assets are consistent with a Next.js App Router application, in which a link of this kind performs a client-side route transition rather than a document load. On that reading, `waitForLoadState('networkidle')` had no document load to wait for, and the repeated `_rsc` requests are consistent with prefetching, which would leave the page already network-idle at the moment the wait ran.

What the evidence establishes directly is narrower, and sufficient: both waits were no-ops, and the synchronous `page.url()` read occurred roughly 16 ms before the URL changed. The test was therefore **timing-dependent rather than deterministically broken**, which is consistent with it passing during local development and failing in CI. A retry would have concealed that rather than removed it.

## Fix

```ts
await expect(page).toHaveURL(/\/apply(\?|$)/);
```

The now-redundant `networkidle` wait inside `LoginPage.clickOpenAccount()` was removed with it. Both changes are in commit [`179da94`](https://github.com/RolanV/ZincBank/commit/179da94fb6d0bc7450f1b68d19c8377c9e4ae94a).

### Why this is the right solution

- **It eliminates the race by construction.** `toHaveURL` is a web-first assertion: it polls until the URL matches or the timeout expires, so there is no window to lose.
- **It asserts the real requirement,** reaching `/apply`, instead of a four-way `OR` whose last clause passed for almost any navigation.
- **It fails usefully.** On failure Playwright reports the expected pattern and the actual URL, instead of `Received: false`.
- **It replaces nine lines with one,** and removes a wait that was doing nothing.

This addresses the synchronisation race that was observed. It does not guarantee that every future execution will pass: the assertion still depends on the third-party application remaining reachable and continuing to route this link to `/apply`, and it does not affect any other failure mode.

### Alternatives considered and rejected

| Alternative | Why not |
|---|---|
| Retry the scenario | Hides a real race rather than removing it; the test stays unreliable. |
| `waitForURL()` before reading `page.url()` | Works, but keeps a manual wait plus a separate assertion where one web-first assertion does both. |
| `waitForLoadState('load')` instead of `networkidle` | A client-side transition fires no document load, so this would not help. |
| Fixed `waitForTimeout()` | Trades a race for an arbitrary delay: slower and still unreliable. |

## Verification

| Step | Result |
|---|---|
| Single affected scenario, run locally by exact name | pass |
| Repeated locally to probe for flakiness | passed every attempt |
| [Full `@ci` suite in GitHub Actions](https://github.com/RolanV/ZincBank/actions/runs/39333444978) on Linux, commit `179da94` | **12 scenarios, 12 passed, 0 failed** |
| Framework Checks | unaffected; 22 scenarios and 159 steps resolved |

## What this changed beyond one test

- `networkidle` is not a reliable synchronisation strategy for client-side routing. Three other uses remain in the codebase, scoped to `goto` calls; reviewing them is a remaining improvement opportunity.
- Asserting on booleans returned from page-object helpers destroys diagnostic value. Several step definitions still do this; replacing them is a remaining improvement opportunity.
- A failure-only trace upload turned a one-line error message into a complete, millisecond-level account of what the browser did. That is the reason CI retains traces on failure.

## Process note

This investigation was carried out with AI assistance. The trace was examined, the hypothesis was tested against the evidence rather than assumed, alternatives were weighed, and the fix was validated on the single affected scenario before the full suite was re-run in CI.
