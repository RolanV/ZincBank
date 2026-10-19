# CI execution record — 2026-10-19

A historical snapshot. GitHub Actions logs and artifacts expire, so this file records the verified outcome of the runs that validated the CI rebuild.

It contains counts, commit SHAs and run links only. **No test report, trace, screenshot or credential is included.**

| | |
|---|---|
| Date | 2026-10-19 |
| Commit | `dfa4cd7fb145d89abbaaf2f25bb00134c722a67f` (merge of pull request #2) |
| Runner | `ubuntu-latest` |
| Node | v22.23.3 |
| Browser | Chromium (Playwright 1.62) |
| Application | `zincbank.cydeo.io` — third-party; reachable on this date |

## Results on `main`

| Workflow | Run | Result | Duration | Measured |
|---|---|---|---|---|
| Framework Checks | [39334388360](https://github.com/RolanV/ZincBank/actions/runs/39334388360) | pass | 51 s | 22 scenarios and 159 steps **resolved, not executed**; 0 undefined, ambiguous or pending |
| E2E — read-only smoke (`@ci`) | [39334388366](https://github.com/RolanV/ZincBank/actions/runs/39334388366) | pass | 2 m 10 s | **12 scenarios executed, 12 passed; 78 steps passed, 0 failed** |
| E2E — full regression | — | not run | — | Manual dispatch only; never executed in CI |

### What "resolved, not executed" means

Framework Checks runs `cucumber-js --dry-run`. Cucumber matches every Gherkin step to a step definition and loads the step and hook modules, but **runs nothing**: no browser is launched and no request reaches the application. It validates wiring, not behaviour.

Live E2E is the only evidence of actual browser execution in this record: 12 scenarios, 78 steps.

## Preceding runs on pull request #2

The same pull request recorded a real failure and its fix.

| Commit | Workflow | Result | Measured |
|---|---|---|---|
| `47c7d17` | Framework Checks | pass | 22 scenarios, 159 steps resolved |
| `47c7d17` | E2E — read-only smoke | **fail** | 12 scenarios: 11 passed, 1 failed |
| `179da94` | Framework Checks | pass | 22 scenarios, 159 steps resolved |
| `179da94` | E2E — read-only smoke | pass | 12 scenarios, 12 passed |

The failing scenario was `User can navigate to account creation page`. The cause was a client-side navigation race, diagnosed from the Playwright trace uploaded by the failing run and fixed in `179da94`. See [case-study-navigation-race.md](./case-study-navigation-race.md).

## Scope and caveats

- These results reflect one point in time against a third-party application that may since have changed or become unavailable.
- Full regression, 20 scenarios, has **never** been executed in CI. It registers accounts on a shared training server with no teardown, so it is gated behind manual dispatch.
- Chromium only.
- Node 22 is the runtime verified in GitHub Actions.
