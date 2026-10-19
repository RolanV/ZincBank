# ZincBank Test Automation

[![Framework Checks](https://github.com/RolanV/ZincBank/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/RolanV/ZincBank/actions/workflows/ci.yml)
[![E2E (live demo app)](https://github.com/RolanV/ZincBank/actions/workflows/e2e.yml/badge.svg?branch=main&event=push)](https://github.com/RolanV/ZincBank/actions/workflows/e2e.yml)

Playwright + TypeScript + Cucumber BDD test automation for **ZincBank**, a banking practice application hosted by CYDEO at `zincbank.cydeo.io`.

An educational QA automation project, built with AI assistance on a framework introduced during instructor-led CYDEO training. The focus is specification design, framework architecture, and a CI setup that stays verifiable even when the application under test is not — ZincBank is third-party and may change or be withdrawn at any time.

## What it demonstrates

- **BDD specification design** — Gherkin features tagged for selective execution across automatic, regression, and known-defect suites
- **Page Object Model** — locators and interactions encapsulated; page objects carry no assertions, so one object serves both positive and negative scenarios
- **Cucumber lifecycle management** — a typed custom `World`, a fresh browser context per scenario, tracing on every scenario, screenshot and trace retained only on failure
- **CI design under an external dependency** — framework validation separated from live browser execution, so neither is hostage to the other
- **Defect investigation** — a flaky test diagnosed from Playwright trace evidence rather than retried: see the [case study](docs/case-study-navigation-race.md)

## Stack

| Tool | Role |
|---|---|
| Playwright 1.62 | Browser automation (Chromium) |
| TypeScript 5 | Step definitions, page objects |
| Cucumber.js 13 | BDD runner, Gherkin parsing, tag filtering |
| Cucumber HTML formatter | Test report |
| GitHub Actions | CI — two workflows |
| ESLint, Prettier | Lint and format |

**Node 22** is the version verified in GitHub Actions (v22.23.3). `@cucumber/cucumber@13` declares `engines.node: "22 || 24 || >=26"`.

## Architecture

```text
features/                  Gherkin specifications
  account-opening/           A1 - open a checking account
  authentication/            A2 - sign in
  duplicate-email/           A3 - duplicate-email registration
steps/                     Step definitions, mirroring features/
pages/                     BasePage, LoginPage, OpenAccountPage, DuplicateEmailPage
hooks/globalHooks.ts       Cucumber World, browser lifecycle, tracing
globalPagesSetup.ts        Page-object wiring, re-initialised per scenario
utilities/                 Shared helpers
data/                      Test-data fixtures
.clinerules/               Markdown rule definitions
.cline/                    Markdown agent, skill, prompt and template definitions
.github/workflows/         ci.yml (Framework Checks), e2e.yml (Live E2E)
docs/                      CI evidence record and case study
```

### Design decisions

**Typed Cucumber `World`.** `CustomWorld` carries per-scenario data such as the registered email and entered form values, so assertions compare against what the scenario itself produced rather than against fixed fixtures.

**Fresh browser per scenario.** `Before` launches Chromium, opens a context and page, and starts tracing. `After` captures a screenshot and trace only when `scenario.result.status === FAILED`, and discards the trace otherwise — diagnostics when they are useful, no storage cost when they are not.

**Serial execution.** Scenarios run serially: `cucumber.js` sets no `parallel` option. Page-object wiring is held in module-level bindings in `globalPagesSetup.ts`, reassigned for each scenario by `initElements()`. Parallel execution is not configured and has not been tested here; that wiring would need review and verification before enabling it.

**Assertions live in step definitions.** Page objects expose locators and actions only.

**Known defects are tagged, not deleted.** Two scenarios encode behaviour the acceptance criteria require but the application does not currently exhibit. They are excluded from the CI gate so a genuine regression is never mistaken for a documented one, and can be run deliberately with `npm run test:known-issues`.

### Tags

| Tag | Purpose |
|---|---|
| `@ci` | Scenarios selected for automatic CI; they avoid the account-registration flows |
| `@known-bug` | Expected to fail; documents behaviour the application does not exhibit |
| `@smoke`, `@regression` | Breadth selection |
| `@A1`, `@A2`, `@A3` | Module traceability |

## Test coverage

3 feature files, **22 executable scenarios**, 159 steps. There are 21 `Scenario` and `Scenario Outline` blocks; one Outline contributes two examples.

| Module | Scenarios | Covers |
|---|---:|---|
| A1 - Open an account | 1 | Full multi-step application through to dashboard |
| A2 - Login | 14 | Valid sign-in, case-insensitive email, empty, invalid and incorrect credentials, field masking, accessibility labels, navigation |
| A3 - Duplicate email | 7 | Duplicate rejection, case and whitespace boundaries, form-state retention, existing-account integrity |

| Suite | Script | Scenarios | Registers accounts |
|---|---|---:|---|
| Automatic CI gate | `test:ci` | 12 | No; excludes the registration flows |
| Regression | `test:passing` | 20 | Yes |
| Known defects | `test:known-issues` | 2 | Yes |

`test:passing` excludes the two `@known-bug` scenarios, but it includes the account-registration flows and **has not been executed in CI**. Only the 12 `@ci` scenarios have verified CI results.

## Getting started

```bash
npm ci                            # Node 22
npx playwright install chromium
```

```bash
npm run test:ci            # 12 scenarios; no account registration
npm run test:passing       # 20 scenarios, excludes @known-bug; registers accounts; not CI-verified
npm run test:known-issues  # 2 scenarios; expected to fail
npm run test:dry           # resolve all steps; no browser, no network
npm run lint
```

> `npm test` runs every scenario including `@known-bug`, so it exits non-zero by design. `npm run test:passing` excludes those two scenarios, but it also drives the account-registration flows and has not been verified by CI.

Failures write `reports/cucumber-report.html` plus a screenshot and Playwright trace to `reports/`. Open a trace with:

```bash
npx playwright show-trace reports/trace-<timestamp>.zip
```

## CI

Two workflows answering different questions. Neither runs on a schedule.

### Framework Checks (`ci.yml`) — no demo server required

Lint, then `cucumber-js --dry-run` across every scenario, then a scenario-integrity guard.

The dry run validates **Gherkin-to-step-definition matching** and that step and hook modules load under ts-node. **No scenario is executed:** no browser launches, and no request reaches the application.

The guard exists because `cucumber-js` exits `0` even when it reports undefined or ambiguous steps, and when a tag expression matches nothing — with or without `--strict`. An exit code alone therefore cannot distinguish a real pass from a vacuous one. The guard fails the job on undefined, ambiguous or pending steps, on zero discovered scenarios, or when no Cucumber summary is produced. It was added after an undefined step was found during investigation, to prevent that class of problem from being silently accepted again.

This workflow stays meaningful if the demo application is withdrawn.

### Live E2E (`e2e.yml`) — requires the demo server

- **Read-only smoke** — automatic on push and pull request to `main`: the 12 `@ci` scenarios. These avoid the account-registration flows and are intended not to create persistent test accounts.
- **Full regression** — manual dispatch only, because each run registers accounts on a shared training server with no teardown.

Reports, screenshots and traces upload on failure only. The HTML report renders Gherkin step text verbatim, which includes test credentials, so publishing it on every run was needless exposure.

## Verified results — 2026-10-19

Commit [`dfa4cd7`](https://github.com/RolanV/ZincBank/commit/dfa4cd7fb145d89abbaaf2f25bb00134c722a67f), `ubuntu-latest`, Node v22.23.3, Chromium.

| Workflow | Result | What was measured |
|---|---|---|
| [Framework Checks](https://github.com/RolanV/ZincBank/actions/runs/39334388360) | pass, 51 s | **22 scenarios and 159 steps resolved, not executed.** Zero undefined, ambiguous or pending steps. |
| [E2E — read-only smoke](https://github.com/RolanV/ZincBank/actions/runs/39334388366) | pass, 2 m 10 s | **12 scenarios executed, 12 passed. 78 steps passed, 0 failed.** |
| E2E — full regression | not run | Manual dispatch only. **Never executed in CI,** so its 20 scenarios are unverified by CI. |

Full record, including the preceding failing run and its fix: [`docs/ci-evidence-2026-10-19.md`](docs/ci-evidence-2026-10-19.md)

## Limitations

- **Third-party application.** Hosted by CYDEO; it can change or be withdrawn without notice. A Live E2E failure may reflect that rather than a framework defect.
- **No teardown.** Registration scenarios create accounts on a shared training server and nothing removes them, so full regression is manual-only.
- **Serial execution.** Parallel execution is not configured or tested; see [Design decisions](#design-decisions).
- **Test credentials are committed** in `features/` and remain in git history. The project uses CYDEO practice credentials for the training application. They have not been removed or rotated.
- **Scope.** Chromium only. No API-layer, visual or performance testing.
- **Two scenarios document behaviour the application does not exhibit,** tagged `@known-bug`.
- **Some step definitions assert on booleans** returned by page-object helpers, using `expect(value).toBeTruthy()`. This discards Playwright's auto-waiting and produces weak failure messages. Replacing them is a remaining improvement opportunity.
- **A Husky pre-commit hook is configured** in the repository, but it is not verified by CI and its behaviour has not been confirmed in this project.
- **Development artifacts retained.** `handoffs/`, `reports/A3-*.md` and `tests/LOGIN_TEST_SUITE.md` are working notes from development, kept for transparency rather than as documentation.

## Background

### Instructor-led training

The framework scaffolding — tool configuration, the original CI workflow, and the `.clinerules/` and `.cline/` documentation sets — was introduced by **@AdamB25**, one of my instructors at CYDEO, during instructor-led training. I did not design or create that original scaffold.

The ZincBank test automation built on top of it — the Gherkin specifications, step definitions, page objects, Cucumber World and lifecycle hooks, the two-workflow CI design, and the defect investigation in the case study — is my implementation, produced with AI assistance as described below.

### AI-assisted development

This is an **AI-assisted** project, and I would rather state that than imply otherwise.

I directed the work, reviewed the implementation, investigated problems with AI assistance, evaluated the proposed solutions, and verified the results. I did not hand-write every line, and the project is not AI output accepted without engineering involvement.

The CI rebuild is a concrete example. The first live E2E run failed one scenario with `expect(received).toBeTruthy()` and `Received: false` — a message carrying no URL and no context. Rather than retrying it, we examined the Playwright trace uploaded by the failing run, identified a client-side navigation race, replaced the assertion with Playwright's auto-retrying `toHaveURL()`, validated the single affected scenario, and then confirmed all 12 E2E scenarios passing in GitHub Actions. The evidence, reasoning and rejected alternatives are written up in [the case study](docs/case-study-navigation-race.md).

### `.clinerules/` and `.cline/`

These directories contain **Markdown documents only** — rule definitions in `.clinerules/` covering architecture, coding standards, locator rules, naming conventions, a review checklist, security and a human-approval process, and agent, skill, prompt and template definitions in `.cline/`. They came with the training scaffolding.

They are documentation and configuration. **No CLI or tool that executes them is installed in this repository,** and no part of the test suite depends on them.
