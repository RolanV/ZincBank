import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage - Page Object Model for ZincBank login page
 * Encapsulates all interactions with the login page without assertions
 */
export class LoginPage extends BasePage {
  readonly logo: Locator;
  readonly welcomeBackText: Locator;
  readonly heading: Locator;
  readonly emailLabel: Locator;
  readonly emailInput: Locator;
  readonly passwordLabel: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly openAccountLink: Locator;
  readonly errorMessage: Locator;
  readonly loginErrorNote: Locator;

  constructor(page: Page) {
    super(page);

    // Logo and headers
    this.logo = page.locator('img[alt="ZincBank"]').or(page.locator('text=ZincBank').first());
    this.welcomeBackText = page.getByText('Welcome back', { exact: false });
    this.heading = page.getByRole('heading', { name: 'Sign in to ZincBank' });

    // Form labels
    this.emailLabel = page.getByText('Email').first();
    this.passwordLabel = page.getByText('Password').first();

    // Form inputs - using accessibility selectors as primary
    this.emailInput = page
      .getByLabel('Email', { exact: false })
      .or(page.locator('input[type="email"]'))
      .or(page.locator('input[placeholder="you@example.com"]'));

    this.passwordInput = page
      .getByLabel('Password', { exact: false })
      .or(page.locator('input[type="password"]'));

    // Buttons and links
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.openAccountLink = page
      .getByRole('link', { name: 'Open an account' })
      .or(page.getByText('Open an account'));

    // Error messages - the app renders a single inline note (testid login-error)
    this.errorMessage = page.getByTestId('login-error');
    this.loginErrorNote = page.getByTestId('login-error');
  }

  /**
   * Navigate to the ZincBank login page
   */
  async goto(): Promise<void> {
    await this.page.goto('https://zincbank.cydeo.io/login', { waitUntil: 'networkidle' });
  }

  /**
   * Fill email input field
   * @param email - The email address to enter
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password input field
   * @param password - The password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Clear email input field
   */
  async clearEmail(): Promise<void> {
    await this.emailInput.clear();
  }

  /**
   * Clear password input field
   */
  async clearPassword(): Promise<void> {
    await this.passwordInput.clear();
  }

  /**
   * Click the Sign in button
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
    // Wait for navigation or error message
    await this.page.waitForLoadState('networkidle').catch(() => {
      // Network might not be idle if there's an error, that's ok
    });
  }

  /**
   * Click the Open an account link
   */
  async clickOpenAccount(): Promise<void> {
    // No load-state wait: this is a client-side route change, so there is no
    // document load to wait for. The caller asserts the destination with a
    // web-first assertion, which retries until the router commits.
    await this.openAccountLink.click();
  }

  /**
   * Fill email and password fields and submit
   * @param email - The email address
   * @param password - The password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  /**
   * Get the current value of email input
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  /**
   * Get the current value of password input (should be masked)
   */
  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  /**
   * Check if email input is visible
   */
  async isEmailInputVisible(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }

  /**
   * Check if password input is visible
   */
  async isPasswordInputVisible(): Promise<boolean> {
    return await this.passwordInput.isVisible();
  }

  /**
   * Check if Sign in button is visible
   */
  async isSignInButtonVisible(): Promise<boolean> {
    return await this.signInButton.isVisible();
  }

  /**
   * Check if Sign in button is enabled
   */
  async isSignInButtonEnabled(): Promise<boolean> {
    return await this.signInButton.isEnabled();
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible().catch(() => false);
  }

  /**
   * Get error message text
   */
  async getErrorMessageText(): Promise<string> {
    try {
      return (await this.errorMessage.textContent()) || '';
    } catch {
      return '';
    }
  }

  /**
   * Check if page heading is visible
   */
  async isHeadingVisible(): Promise<boolean> {
    return await this.heading.isVisible();
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Check if user was redirected to dashboard
   */
  async isDashboardVisible(): Promise<boolean> {
    return this.page.url().includes('dashboard') || this.page.url().includes('home');
  }

  /**
   * Wait for specific timeout in milliseconds
   * @param ms - Milliseconds to wait
   */
  async waitFor(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
