# imx‑server Test Catalog

The **imx‑server** project is a Node.js‑based API that orchestrates a variety of data services. All unit and integration tests are located under `./tests/` and are executed with **Jest**. Below is a high‑level catalogue of the source modules that are covered by tests and a quick reference to the test modules that exercise each component.

---

## Source → Test Mapping

| Source Module                  | Test File                        | Test Purpose                                             |
| ------------------------------ | -------------------------------- | -------------------------------------------------------- |
| `functions/get-db-data.js`     | `tests/get-db-data.test.js`      | Tests environment‑based DB config resolution.            |
| `functions/error-handler.js`   | `tests/error-handler.test.js`    | Verifies error handling middleware.                      |
| `functions/get-user-data.js`   | `tests/get-user-data.test.js`    | Tests authentication strategy selection.                 |
| `functions/check-index.js`     | `tests/check-index.test.js`      | Ensures index existence and creation logic.              |
| `functions/create-sort-obj.js` | `tests/create-sort-obj.test.js`  | Validates sort‑object generation logic.                  |
| `mailer/healthchecks.js`       | `tests/healthchecks.test.js`     | Checks email construction for health‑check failures.     |
| `functions/send-logs.js`       | `tests/send-logs.test.js`        | Verifies logging of endpoints and authentication events. |
| `startup/test-connections.js`  | `tests/test-connections.test.js` | Tests connectivity health checks for all services.       |

---

## Test Suite Overview

- **Framework**: `jest`
- **Coverage Tool**: `nyc` (Istanbul).

---

## Running the Tests

```bash
# From the root of imx-server
npm ci           # install dependencies
npm run test         # run all tests
npm run test:cov  # generate coverage report
```

To run a single test file:

```bash
npm test -- tests/get-db-data.test.js
```

---

## Adding a New Feature

1. Create the module in the appropriate folder (`functions/`, `apis/`, etc.).
2. Write a corresponding test in `tests/` mirroring the directory layout.
3. Run the new test locally to confirm it passes.
4. Commit changes; CI will automatically run the full suite.

---

## Quick Reference Links

| Area                      | Path                           | Notes                       |
| ------------------------- | ------------------------------ | --------------------------- |
| Server entry              | `index.js`                     | General health endpoints    |
| DB utilities              | `functions/get-db-data.js`     | Central DB abstraction      |
| Error handling            | `functions/error-handler.js`   | HTTP status mapping         |
| Log routing               | `functions/send-logs.js`       | Elastic/Logstash/Fluentd    |
| Sorting helpers           | `functions/create-sort-obj.js` | Dashboard query sorting     |
| STIX conversion           | `functions/stix-1.js`          | STIX‑1.x conversion scripts |
| Authentication strategies | `auth/`                        | OAuth, Keycloak, Basic      |
| REST APIs                 | `endpoints/`                   | Domain‑specific endpoints   |
| External APIs             | `apis/`                        | Taxii, MISP, IMX, etc.      |

This catalogue provides a concise, at‑a‑glance view of test coverage for the imx‑server codebase.
