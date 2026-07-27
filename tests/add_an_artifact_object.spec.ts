import { test, expect } from '../playwright/fixtures';
import {
  publish_bundle,
  delete_published_objects,
} from './utils/common_actions';

// add an artifact object
test('artifact page', async ({ authenticatedPage }) => {
  try {
    await authenticatedPage.getByText('Editor').click();

    await authenticatedPage.getByTitle('Add Object').click();

    await authenticatedPage.getByText('Cyber Observables').click();

    await authenticatedPage.getByText('Artifact').click();

    const id_string = await authenticatedPage.locator('#id').inputValue();
    await expect(id_string).toEqual('artifact--');

    const type_string = await authenticatedPage.locator('#type').inputValue();
    await expect(type_string).toEqual('artifact');

    const spec_version_string = await authenticatedPage
      .locator('#spec_version')
      .inputValue();
    await expect(spec_version_string).toEqual('2.1');

    // Enter a URL
    const url = 'https://example.com/downloads/example_file.dat';
    await authenticatedPage.locator('#url').fill(url);

    // Select MD5 hash and enter the hash value
    const dropdown = authenticatedPage.locator('#hashesKey');
    await dropdown.selectOption('MD5');
    await authenticatedPage
      .locator('#hashesValue')
      .fill('1be2a8e7fc3688008336ae7dd4afe5b3');
    await authenticatedPage.locator('#hashes_add').click();

    // Click Add to Bundle
    await authenticatedPage
      .getByRole('button', { name: 'Add to Bundle', includeHidden: true })
      .click();

    // Find this object in the Editor Page
    await authenticatedPage.locator('#expand-objects').click();

    await expect(
      authenticatedPage.locator('span', { hasText: url }),
    ).toBeVisible();

    // Publish the object
    await publish_bundle(authenticatedPage);

    // Delete the object
    await delete_published_objects(authenticatedPage);
  } catch (error) {
    // Delete any published objects
    await delete_published_objects(authenticatedPage);
    throw error;
  }
});
