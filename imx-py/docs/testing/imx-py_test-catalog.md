# imx‑py Test Catalog

The **imx‑py** package is a Flask‑based REST API that exposes STIX‑based data conversion and retrieval.
All unit and integration tests live under `./tests/` and are executed with `pytest`. Below is a high‑level catalogue of the source files that are covered by tests and a quick reference to the test modules that exercise each component.

---

## Source → Test Mapping

| Source Module                | Test File                                                          | Test Purpose                                                         |
| ---------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `app.py`                     | `tests/main_test.py`                                               | Smoke‑test for the Flask app context, health‑check & basic routing.  |
| `main.py`                    | `tests/main_test.py`                                               | Validates config loading, environment variables, and startup path.   |
| `controllers/STIXHelper.py`  | `tests/stixhelper_test.py`                                         | Unit tests for helper utilities (object mapping, schema validation). |
| `controllers/STIXLinks.py`   | `tests/stixlinks_test.py`                                          | Tests linking logic between STIX objects.                            |
| `controllers/doc_factory.py` | `tests/stix_1_test.py`                                             | Verifies document generation for STIX 1.x objects.                   |
| `routes/stix_1.py`           | `tests/stix_1_test.py`                                             | End‑point tests for STIX 1.x routes.                                 |
| `routes/misp_stix.py`        | `tests/misp_stix_test.py`                                          | Tests MISP‑to‑STIX conversion routes.                                |
| `middleware/errors.py`       | `tests/errors_test.py`                                             | Checks error handling middleware and HTTP‑status mapping.            |
| `middleware/logging.py`      | `tests/logging_test.py`                                            | Ensures request/response logging middleware is active.               |
| `wsgi.py`                    | `tests/main_test.py`                                               | Validates WSGI entry‑point integration.                              |
| `middleware/config.py`       | No dedicated tests (configuration is exercised in `main_test.py`). |

---

## Test Suite Overview

- **Framework**: `pytest` with `pytest‑cov` for coverage reporting.
- **Coverage Thresholds**: 90 % coverage across the project (enforced via `coveragexml`).
- **Runtime**: Tests run in an isolated virtual environment (`.venv`) and use the `tests/__init__` helper (if any) to set up fixtures.
- **Continuous Integration**: The CI pipeline (`.github/workflows/ci.yml`) automatically runs `pytest --cov=imx_py` on each PR.

---

## Running the Tests

```bash
# Activate the virtual env
. .venv/bin/activate

# Run the entire suite
pytest

# Run a specific test module
pytest tests/stix_1_test.py

# Generate a coverage report
pytest --cov=imx_py --cov-report=html
```

---

## Adding a New Feature

1. **Create** the new module in the appropriate directory (`controllers`, `routes`, etc.).
2. **Add** a corresponding test file in `tests/`, mirroring the path pattern.
3. **Run** the test suite locally to verify everything passes.
4. **Push** the branch; CI will ensure coverage stays above 90 %.

---

### Quick Reference Links

- **Main App**: `./app.py` – `tests/main_test.py`
- **STIX Helpers**: `./controllers/STIXHelper.py` – `tests/stixhelper_test.py`
- **STIX Linking**: `./controllers/STIXLinks.py` – `tests/stixlinks_test.py`
- **Document Factory**: `./controllers/doc_factory.py` – `tests/stix_1_test.py`
- **STIX 1.x Routes**: `./routes/stix_1.py` – `tests/stix_1_test.py`
- **MISP‑STIX Routes**: `./routes/misp_stix.py` – `tests/misp_stix_test.py`
- **Middleware**: Errors (`middleware/errors.py`) – `tests/errors_test.py`; Logging (`middleware/logging.py`) – `tests/logging_test.py`

This catalogue gives you an at‑glance view of what each part of the project is covered by tests, and where to locate the relevant test files.
