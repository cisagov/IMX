import { test as baseTest, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Force load env variables for this fixture module
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define the type for your custom fixture
type MyFixtures = {
  authenticatedPage: import('@playwright/test').Page;
};

export const test = baseTest.extend<MyFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto(process.env.IMX_HOST!);

    if (process.env.AUTH! != 'none') {
      // Expect a title "to contain" a substring.
      await expect(page).toHaveTitle('Sign in to TIE');

      // Enter username and password.
      await page.getByLabel('Username or email').fill(process.env.IMX_USER!);
      await page
        .getByRole('textbox', { name: 'Password', includeHidden: true })
        .fill(process.env.IMX_PASS!);
      await page
        .getByRole('button', { name: 'Sign in', includeHidden: true })
        .click();
    }

    // Await for successful login
    await expect(page).toHaveTitle('IMX');
    const toast_message = page.getByRole('button', { name: 'Close' });
    //If status toast message appears, dismiss it
    if (await toast_message.isVisible()) {
      await toast_message.click();
    }
    await use(page);

    // End of authentication steps.
  },
});
export { expect };
