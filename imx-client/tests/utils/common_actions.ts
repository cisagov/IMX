import { Page, expect } from '@playwright/test';

export async function publish_bundle(page: Page) {
  // Publish the object
  await page.locator('#open-publish-btn').click();
  const report_name = Math.random().toString(36).substring(2, 12);
  await page
    .getByPlaceholder('Enter a name for your bundle.')
    .fill(report_name);

  await page
    .locator(
      '//div//span[contains(text(), "API Roots")]//..//div//button[@id="sortMenu"]',
    )
    .click();
  await page
    .getByRole('button', { name: 'test-root', includeHidden: true })
    .click();

  await page
    .locator(
      '//div//span[contains(text(), "Collections")]//..//div//button[@id="sortMenu"]',
    )
    .click();
  await page.getByRole('button', { name: 'test', exact: true }).click();

  await page.getByRole('button', { name: 'Next', includeHidden: true }).click();

  await page
    .getByRole('button', { name: 'Publish', includeHidden: true })
    .click();

  await page.getByText('Click to Show Details').click();
  const publish_details = await page.locator('pre').innerText();
  const json_obj = await JSON.parse(publish_details);
  var publish_pending = true;

  while (publish_pending == true) {
    if (json_obj['pending_count'] == 0) {
      publish_pending = false;
      await expect(json_obj['total_count']).toEqual(2);
      await expect(json_obj['total_count']).toEqual(json_obj['success_count']);
    } else {
      await page.waitForTimeout(1000);
    }
  }
  await page
    .locator(
      '//div[@class="toast-header"]//..//button[contains(text(), "Close")]',
    )
    .click();
  await page
    .getByRole('button', { name: 'Cancel', includeHidden: true })
    .click();
}

export async function objects_not_present(page: Page) {
  const elem = page.locator('input[name="select-all"]');
  try {
    await elem.waitFor({ state: 'visible', timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}
export async function delete_published_objects(page: Page) {
  await page.getByRole('link', { name: 'Search' }).click();
  await page.getByText('test-root', { exact: true }).click();
  await page.getByText('test', { exact: true }).click();

  await page.getByRole('button', { name: 'Search' }).click();

  var present = false;

  while (!present) {
    await page.locator('input[name="select-all"]').click();
    await page.getByRole('button').filter({ hasText: 'Delete' }).click();
    await page.getByRole('button', { name: 'Search' }).click();
    present = await objects_not_present(page);
  }
}
