# imx‑client Test Catalog

The **imx‑client** is an Angular application. All unit tests are written in TypeScript with Jest and follow the `*.spec.ts` naming convention. Below is a high‑level catalogue of the main source directories and their corresponding test files, along with a brief description of what each test suite covers.

---

## Source → Test Mapping

| Spec File                                                                            | Component / Service Tested         | Focus                                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------- |
| `dialogs/customize-columns/customize-columns.component.spec.ts`                      | _CustomizeColumnsComponent_        | Verifies column selection logic and UI events.                |
| `dynamic-form-component/question-base.spec.ts`                                       | _QuestionBase_ (abstract class)    | Base question properties and validation.                      |
| `dynamic-form-component/question-control.service.spec.ts`                            | _QuestionControlService_           | Service that registers/creates question controls dynamically. |
| `dynamic-form-component/app-question/app-question.helper.spec.ts`                    | App‑question helper utilities      | Helper functions for constructing question objects.           |
| `dialogs/help-dialog/help-dialog.component.spec.ts`                                  | _HelpDialogComponent_              | Confirm dialog renders, opens/closes correctly.               |
| `dynamic-form-component/app-question/pattern-builder/observation-expression.spec.ts` | Observation expression logic       | Ensures observation expression generation/parsing.            |
| `dynamic-form-component/app-question/pattern-builder/stix-pattern.spec.ts`           | STIX pattern builder               | Builds and validates STIX pattern strings.                    |
| `dynamic-form-component/app-question/pattern-builder/comparison-expression.spec.ts`  | Comparison expression logic        | Handles comparison operators in STIX patterns.                |
| `dynamic-form-component/app-question/pattern-builder/qualifier-base.spec.ts`         | Qualifier base logic               | Base class for qualifiers in pattern builder.                 |
| `dynamic-form-component/string-array-validators.spec.ts`                             | String array validators            | Custom validators for array inputs.                           |
| `dynamic-form-component/app-question/pattern-builder/obs-starts.spec.ts`             | Observation starts logic           | Validates `obs_starts` constraint logic.                      |
| `dynamic-form-component/app-question/pattern-builder/qualifier-within.spec.ts`       | Qualifier `within` logic           | Handles time‑range qualifiers.                                |
| `dialogs/message-dialog/message-dialog.component.spec.ts`                            | _MessageDialogComponent_           | Modal message rendering and interactions.                     |
| `dynamic-form-component/question-types/question-indicator-pattern.spec.ts`           | Indicator‑pattern questions        | Pattern generation for indicators.                            |
| `dynamic-form-component/question-types/question-kill-chain.spec.ts`                  | Kill‑chain questions               | Validates kill‑chain related inputs.                          |
| `dynamic-form-component/question-types/question-object.spec.ts`                      | Generic object questions           | Validates generic object questions.                           |
| `dynamic-form-component/question-types/question-language-contents.spec.ts`           | Language contents questions        | Tests locale‑aware text fields.                               |
| `dynamic-form-component/question-types/question-hybrid-array.spec.ts`                | Hybrid‑array questions             | Validates complex hybrid array types.                         |
| `dynamic-form-component/question-types/question-dropdownsum.spec.ts`                 | Dropdown‑sum questions             | Tests aggregated dropdown selections.                         |
| `dynamic-form-component/question-types/question-datepicker.spec.ts`                  | Datepicker questions               | Validates date input, min/max ranges.                         |
| `dynamic-form-component/question-types/question-body-multipart.spec.ts`              | Multipart body questions           | Upload form data handling.                                    |
| `dynamic-form-component/question-types/question-dropdown.spec.ts`                    | Dropdown questions                 | Dropdown value handling.                                      |
| `dynamic-form-component/question-types/question-extension-type.spec.ts`              | Extension type questions           | Tests custom extension schema.                                |
| `dynamic-form-component/question-types/question-non-blank-dropdown.spec.ts`          | Non‑blank dropdown                 | Enforces non‑empty selection.                                 |
| `dynamic-form-component/question-types/question-email-address.spec.ts`               | Email‑address questions            | Validates email format.                                       |
| `dynamic-form-component/question-types/question-file-upload.spec.ts`                 | File‑upload questions              | File selection and validation.                                |
| `dynamic-form-component/question-types/question-definition.spec.ts`                  | Definition questions               | Structure of definitions.                                     |
| `dynamic-form-component/question-types/question-bundle-obj.spec.ts`                  | Bundle‑object questions            | STIX bundle object handling.                                  |
| `dynamic-form-component/question-types/question-mime.spec.ts`                        | MIME questions                     | Validates MIME type inputs.                                   |
| `dynamic-form-component/question-types/question-file-field-upload.spec.ts`           | File‑field upload                  | Field‑level file upload validation.                           |
| `dynamic-form-component/question-types/question-hybrid.spec.ts`                      | Hybrid questions                   | Validates hybrid data structures.                             |
| `dynamic-form-component/question-types/question-identity.spec.ts`                    | Identity questions                 | Identity field validation.                                    |
| `dynamic-form-component/question-types/question-hash-array.spec.ts`                  | Hash‑array questions               | Hash array handling.                                          |
| `dialogs/copy-paste-dialog/copy-paste-dialog.component.spec.ts`                      | _CopyPasteDialogComponent_         | Copy/paste modal functionality.                               |
| `dialogs/copy-paste-dialog/identify-stix/identify-stix.service.spec.ts`              | _IdentifyStixService_              | STIX identification logic.                                    |
| `dialogs/multipart-dialog/multipart-dialog.component.spec.ts`                        | _MultipartDialogComponent_         | Multipart dialog rendering and actions.                       |
| `dialogs/identity-extension-dialog/identity-extension-dialog.component.spec.ts`      | _IdentityExtensionDialogComponent_ | Identity extension UI and validation.                         |

---

## Test Suite Overview

- **Framework**: Vitest (`npx vitest run`).
- **Coverage Tool**: V8.

---

## Running the Tests

```bash
# Unit tests
npm i vitest
npm i --save-dev @vitest/coverage-v8
npx vitest run
```

---

## Adding a New Test

1. Locate the component/service you want to test.
2. Create a file ending in `*.spec.ts` in the same folder, mirroring the component’s file name.
3. Import `TestBed` and configure the module with any necessary declarations/providers.
4. Write Jest (`it`, `expect`) tests to cover the component’s behavior.
5. Run `npx vitest run` to verify.

---

### Quick Reference

- **Dialogs** → `src/app/dialogs/*/*.component.spec.ts`
- **Dynamic Form** → `src/app/dynamic-form-component/**/*.*.spec.ts`

This catalog provides an at‑a‑glance view of which parts of the `imx‑client` codebase are covered by tests and where to find the relevant test files.
