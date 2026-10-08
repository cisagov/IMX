import { test, expect } from '../playwright/fixtures';

// verify home authenticatedPage loads as expected.
test('home authenticatedPage', async ({ authenticatedPage }) => {
  await expect(
    authenticatedPage.getByRole('link', { name: 'Editor' }),
  ).toBeVisible();
  await expect(
    authenticatedPage.getByRole('link', { name: 'Search' }),
  ).toBeVisible();
  await expect(
    authenticatedPage.getByRole('link', { name: 'My Profile' }),
  ).toBeVisible();
  await expect(
    authenticatedPage.getByRole('link', { name: 'Admin' }),
  ).toBeVisible();
  await expect(
    authenticatedPage.getByRole('link', { name: 'Server' }),
  ).toBeVisible();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Add Object' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'TLP' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'ACS Marking' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Analyst1' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'VirusTotal' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'MISP' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Tools' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Save Bundle' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Download Bundle' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Reset Bundle' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Publish Bundle' }),
  ).toBeHidden();
  await expect(
    authenticatedPage.getByRole('button', { name: 'Upload File' }),
  ).toBeHidden();
});
