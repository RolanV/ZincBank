import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { loginPage, page } from '../../globalPagesSetup';

/**
 * Given: User is on the ZincBank login page
 */
Given('the user is on the ZincBank login page', async function () {
  await loginPage.goto();
  await expect(loginPage.heading).toBeVisible();
});

/**
 * Given: User navigates to the ZincBank login page
 */
Given('the user navigates to the ZincBank login page', async function () {
  await loginPage.goto();
});

/**
 * When: User enters email
 */
When('the user enters email {string}', async function (email: string) {
  await loginPage.fillEmail(email);
});

/**
 * When: User enters password
 */
When('the user enters password {string}', async function (password: string) {
  await loginPage.fillPassword(password);
});

/**
 * When: User clicks the Sign in button
 */
When('the user clicks the Sign in button', async function () {
  await loginPage.clickSignIn();
});

/**
 * When: User leaves the email field empty
 */
When('the user leaves the email field empty', async function () {
  await loginPage.clearEmail();
});

/**
 * When: User leaves the password field empty
 */
When('the user leaves the password field empty', async function () {
  await loginPage.clearPassword();
});

/**
 * When: User leaves both email and password fields empty
 */
When('the user leaves both email and password fields empty', async function () {
  await loginPage.clearEmail();
  await loginPage.clearPassword();
});

/**
 * When: User clicks on "Open an account" link
 */
When('the user clicks on {string} link', async function (linkText: string) {
  if (linkText === 'Open an account') {
    await loginPage.clickOpenAccount();
  }
});

/**
 * When: User enters email in the email field
 */
When('the user enters email {string} in the email field', async function (email: string) {
  await loginPage.fillEmail(email);
});

/**
 * When: User enters password in the password field
 */
When('the user enters password {string} in the password field', async function (password: string) {
  await loginPage.fillPassword(password);
});

/**
 * Then: User should be logged in successfully
 */
Then('the user should be logged in successfully', async function () {
  await expect(page).toHaveURL(/dashboard/);
});

/**
 * Then: User should be redirected to the dashboard
 */
Then('the user should be redirected to the dashboard', async function () {
  await expect(page).toHaveURL(/dashboard/);
});

/**
 * Then: Login should be successful
 */
Then('the login should be successful', async function () {
  await expect(page).toHaveURL(/dashboard/);
  await expect(loginPage.loginErrorNote).toHaveCount(0);
});

/**
 * Then: An email validation error should be displayed
 * The app shows a single validation note when a required field is empty.
 */
Then('an email validation error should be displayed', async function () {
  await expect(loginPage.loginErrorNote).toBeVisible();
  await expect(loginPage.loginErrorNote).toContainText('Enter your email and password');
});

/**
 * Then: A password validation error should be displayed
 * The app shows a single validation note when a required field is empty.
 */
Then('a password validation error should be displayed', async function () {
  await expect(loginPage.loginErrorNote).toBeVisible();
  await expect(loginPage.loginErrorNote).toContainText('Enter your email and password');
});

/**
 * Then: An invalid credentials error should be displayed
 */
Then('an invalid credentials error should be displayed', async function () {
  await expect(loginPage.loginErrorNote).toBeVisible();
  await expect(loginPage.loginErrorNote).toContainText('Invalid email or password');
});

/**
 * Then: An email format error should be displayed
 * The app shows the same generic validation note for an invalidly formatted email.
 */
Then('an email format error should be displayed', async function () {
  await expect(loginPage.loginErrorNote).toBeVisible();
  await expect(loginPage.loginErrorNote).toContainText('Enter your email and password');
});

/**
 * Then: User should be redirected to the account creation page
 */
Then('the user should be redirected to the account creation page', async function () {
  // "Open an account" is a Next.js App Router client-side transition: the app
  // fetches an RSC payload (/apply?_rsc=...) and no document load fires, so
  // waitForLoadState('networkidle') resolved in 0ms against the old URL and
  // page.url() was read before the router committed. toHaveURL retries until
  // the URL settles, and reports the actual URL on failure.
  await expect(page).toHaveURL(/\/apply(\?|$)/);
});

/**
 * Then: Email field should display the entered value
 */
Then('the email field should display {string}', async function (expectedEmail: string) {
  const emailValue = await loginPage.getEmailValue();
  expect(emailValue).toBe(expectedEmail);
});

/**
 * Then: Password field should display masked characters
 */
Then('the password field should display masked characters', async function () {
  // Password type input in HTML automatically masks characters
  const passwordType = await loginPage.passwordInput.getAttribute('type');
  expect(passwordType).toBe('password');
});

/**
 * Then: Actual password should not be visible
 */
Then('the actual password should not be visible', async function () {
  // The password is masked by the browser, verify input type is password
  const passwordType = await loginPage.passwordInput.getAttribute('type');
  expect(passwordType).toBe('password');
});

/**
 * Then: Email input should have an accessible label
 */
Then(
  'the email input should have an accessible label {string}',
  async function (labelText: string) {
    const isVisible = await loginPage.isEmailInputVisible();
    expect(isVisible).toBeTruthy();

    // Check if label is present
    const label = page.getByText(labelText, { exact: false });
    const labelVisible = await label.isVisible();
    expect(labelVisible).toBeTruthy();
  },
);

/**
 * Then: Password input should have an accessible label
 */
Then(
  'the password input should have an accessible label {string}',
  async function (labelText: string) {
    const isVisible = await loginPage.isPasswordInputVisible();
    expect(isVisible).toBeTruthy();

    // Check if label is present
    const label = page.getByText(labelText, { exact: false });
    const labelVisible = await label.isVisible();
    expect(labelVisible).toBeTruthy();
  },
);

/**
 * Then: Sign in button should have an accessible label
 */
Then(
  'the Sign in button should have an accessible label {string}',
  async function (labelText: string) {
    await expect(loginPage.signInButton).toBeVisible();
    await expect(loginPage.signInButton).toContainText(labelText);
  },
);

/**
 * Then: Validation errors should be displayed for both fields
 */
Then('validation errors should be displayed for both fields', async function () {
  // The live app shows a single validation note when both fields are empty
  await expect(loginPage.loginErrorNote).toBeVisible();
  await expect(loginPage.loginErrorNote).toContainText('Enter your email and password');
});

/**
 * Then: Login page should load within acceptable time
 */
Then('the login page should load within {int} seconds', async function (seconds: number) {
  const start = Date.now();
  await loginPage.goto();
  const duration = (Date.now() - start) / 1000;
  expect(duration).toBeLessThanOrEqual(seconds);
});

/**
 * Then: All login form elements should be visible
 */
Then('all login form elements should be visible', async function () {
  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.signInButton).toBeVisible();
});
