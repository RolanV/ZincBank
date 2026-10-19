Feature: ZincBank User Login
  As a ZincBank user
  I want to sign in to my account
  So that I can access my banking services

  Background:
    Given the user is on the ZincBank login page

  @A2 @ci @smoke @regression @positive
  Scenario: Student successfully logs in with valid credentials
    When the user enters email "student01@zinc.test"
    And the user enters password "9pJolA7GBQec"
    And the user clicks the Sign in button
    Then the user should be logged in successfully
    And the user should be redirected to the dashboard

  @A2 @ci @regression @positive
  Scenario: User successfully logs in with valid email and password
    When the user enters email "student01@zinc.test"
    And the user enters password "9pJolA7GBQec"
    And the user clicks the Sign in button
    Then the login should be successful

  @A2 @ci @regression @positive
  Scenario: User signs in with differently cased email
    When the user enters email "Student01@Zinc.test"
    And the user enters password "9pJolA7GBQec"
    And the user clicks the Sign in button
    Then the user should be logged in successfully

  @A2 @ci @smoke @regression @negative
  Scenario: Login fails with empty email field
    When the user leaves the email field empty
    And the user enters password "9pJolA7GBQec"
    And the user clicks the Sign in button
    Then an email validation error should be displayed

  @A2 @ci @regression @negative
  Scenario: Login fails with empty password field
    When the user enters email "student01@zinc.test"
    And the user leaves the password field empty
    And the user clicks the Sign in button
    Then a password validation error should be displayed

  @A2 @regression @negative
  Scenario: Login fails with incorrect password
    When the user enters email "student01@zinc.test"
    And the user enters password "wrongpassword123"
    And the user clicks the Sign in button
    Then an invalid credentials error should be displayed

  @A2 @ci @regression @negative
  Scenario: Login fails with unregistered email
    When the user enters email "nonexistent@zinc.test"
    And the user enters password "9pJolA7GBQec"
    And the user clicks the Sign in button
    Then an invalid credentials error should be displayed

  @A2 @ci @regression @negative
  Scenario: Login fails with invalid email format
    When the user enters email "invalid-email-format"
    And the user enters password "9pJolA7GBQec"
    And the user clicks the Sign in button
    Then an email format error should be displayed

  @A2 @ci @regression @positive
  Scenario: User can navigate to account creation page
    When the user clicks on "Open an account" link
    Then the user should be redirected to the account creation page

  @A2 @ci @regression @positive
  Scenario: Email field accepts valid email format
    When the user enters email "test@example.com" in the email field
    Then the email field should display "test@example.com"

  @A2 @ci @regression @positive
  Scenario: Password field masks password characters
    When the user enters password "9pJolA7GBQec" in the password field
    Then the password field should display masked characters
    And the actual password should not be visible

  @A2 @ci @regression @positive
  Scenario: Login page has proper accessibility labels
    Then the email input should have an accessible label "Email"
    And the password input should have an accessible label "Password"
    And the Sign in button should have an accessible label "Sign in"

  @A2 @ci @regression @negative
  Scenario: Both fields are required for form submission
    When the user leaves both email and password fields empty
    And the user clicks the Sign in button
    Then validation errors should be displayed for both fields

  @A2 @regression @positive
  Scenario: Login page loads within acceptable time
    Given the user navigates to the ZincBank login page
    Then the login page should load within 3 seconds
    And all login form elements should be visible
