# IMX - Indicator Messaging eXchange

IMX is a tool used to create reports that cater to the STIX specification and it compliant with storing these reports within TAXII Servers.

IMX itself is intended to be used along side a compatible [TAXII Server](https://github.com/cisagov/IMX-TAXII-Server) (Must follow [OASIS TAXII Committee Specifications](https://www.oasis-open.org/standard/taxii-version-2-1/)).

## Tech Stack

| Layer            | Technology                |
| ---------------- | ------------------------- |
| Frontend         | Angular 20                |
| Backend          | Node.js                   |
| STIX Processing  | Python 3 / Flask          |
| Search & Storage | Opensearch                |
| Observability    | Opensearch Dashboard      |
| Document Parsing | Apache Tika               |
| Authentication   | Keycloak, OIDC (optional) |
| Standards        | STIX 2.1, TAXII 2.1       |

## Prerequisites

The following must be installed before running IMX locally:

- **Node.js** 18.19 or later (and npm)
- **Angular CLI** — install globally with `npm install -g @angular/cli`
- **Python** 3.9 or later (and pip)
- **Docker** and **Docker Compose**

## Deployments

The repo root contains a `docker-compose.yml` and `template.env` for standing up the full IMX stack. Before running, copy the template and fill in values for your environment:

```
cp template.env .env
```

Open `.env` and configure it as needed — at minimum set any auth credentials and service URLs relevant to your setup.

## Local Deployment

### Local Testing

To run the full stack locally:

```
docker compose up -d
```

This starts services in dependency order: Opensearch first, then Opensearch Dashboard, then IMX Server, then IMX Client. IMX Python and Apache Tika start independently. Once all containers are healthy, visit IMX at http://localhost:4200. Port mappings for each service are defined in `docker-compose.yml`.

### Local Development

For active frontend development, bring up the backend services only and run the Angular client directly:

```
docker compose up -d --scale imx-client=0
cd imx-client && npm install && npm start
```

This runs the Angular dev server at http://localhost:4200 with hot reload enabled.

For IMX Server development, see [imx-server/README.md](imx-server/README.md) for instructions on running the server outside Docker. If running it containerized, restart it after changes with:

```
docker compose restart imx-server
```

## Setting up Authentication

There are a couple different options for setting up authentication of IMX. To do so you will need to update the IMX Client's env.json and the IMX Server env variables. Below are a few ways to can configure them:

### No Auth

This is only recommended for development use. To do so make sure that keycloak.enabled and oidc.enabled are set to false in the env.json and IMX Server's AUTH env variable is either empty or set to 'none'. This will allow you to use IMX without authentication and will show you as a 'dev-user' while using the application.

### Keycloak Authentication

It is important to note that even though Keycloak itself supports OIDC and SAML, this does not use either of the two mechanisms. This uses a Keycloak provided NodeJS package called keycloak-js. This is for a few specific use cases in IMX, but also for a tighter integration with Keycloak rather than using OIDC or SAML. To use this authentication set the following in env.json and IMX Server env variables respectively:

- `env.json` - `oidc.enabled` - false
- `env.json` - `keycloak.enabled` - true
- `env.json` - `keycloak.clientId` - {TARGET KEYCLOAK CLIENT ID}
- `env.json` - `keycloak.realm` - {TARGET KEYCLOAK REALM}
- `env.json` - `keycloak.url` - {TARGET KEYCLOAK URL}
- `env.json` - `keycloak.bearerTokenURLs` - {AN ARRAY WITH A LIST OF URLS TO SEND KEYCLOAK ACCESS TOKEN TO}
- `ENV` - `KC_URL` - {TARGET KEYCLOAK URL}
- `ENV` - `KC_REALM` - {TARGET KEYCLOAK REALM}
- `ENV` - `KC_CERT` - {IF DESIRED TO BYPASS TLS VERIFICATION FOR KEYCLOAK SET TO "TEN"}

### OIDC Authentication

For OIDC setup configure the env.json and IMX Server env variables respectively:

- `env.json` - `keycloak.enabled` - false
- `env.json` - `oidc.enabled` - true
- `env.json` - `oidc.apiRoot` - {TARGET OIDC PROVIDER API URL}
- `env.json` - `oidc.bearerTokenURLs` - {AN ARRAY WITH A LIST OF URLS TO SEND OIDC ACCESS TOKEN TO}
- `env.json` - `oidc.clientId` - {TARGET OIDC CLIENT ID}
- `env.json` - `oidc.clientScope` - {SPACE DELIMITED LIST OF OIDC SCOPES}
- `env.json` - `oidc.stsAuthority` - {TARGET OIDC PROVIDER URL}
- `env.json` - `oidc.usernameField` - {TARGET OIDC FIELD FOR USERNAME}
- `ENV` - `OIDC_URL` - {TARGET OIDC PROVIDER API URL}
- `ENV` - `OIDC_USER_FIELD` - {TARGET OIDC FIELD FOR USERNAME}
- `ENV` - `OIDC_CERT` - {IF DESIRED TO BYPASS TLS VERIFICATION FOR OIDC PROVIDER SET TO "false"}

### Testing

At time of writing tests can be executed via mise or directly with playwright. However, before running the playwright task be sure to have a functional connection to a TAXII Server. Otherwise simply run the following:

```
mise run install
mise run playwright
```

These mise tasks will install respective dependencies, execute a build with the docker compose environment with the default .env.example file, and run the playwright tests.

## Integrations

Integrations connect IMX to external threat intelligence sources, allowing users to retrieve indicators, evidences, events, and related threat data. Each integration is configured through the IMX Server env variables listed below. Env values are read as strings, so booleans must be written in lowercase as `true` or `false`.

### Analyst1

Connect to Analyst1, query for evidences, and convert them to STIX.

| Variable                    | Type    | Default | Description                                                                |
| --------------------------- | ------- | ------- | -------------------------------------------------------------------------- |
| `A1_ENABLED`                | Boolean | `false` | Set to `true` to enable the Analyst1 integration.                          |
| `A1_URL`                    | URL     | None    | Base URL of the Analyst1 API. Must end with a trailing slash.              |
| `A1_USER`                   | String  | None    | Analyst1 username, in plain text. IMX encodes it for Basic authentication. |
| `A1_PASS`                   | String  | None    | Analyst1 password, in plain text. IMX encodes it for Basic authentication. |
| `A1_ALLOW_SEARCH_BY_ENV_ID` | Boolean | `true`  | Not currently read by IMX Server.                                          |

### Virus Total

Connect to Virus Total and query for indicators.

| Variable              | Type    | Default                       | Description                                                                                                                |
| --------------------- | ------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `VIRUS_TOTAL_ENABLED` | Boolean | `false`                       | Set to `true` to enable the Virus Total integration.                                                                       |
| `VIRUS_TOTAL_PROXY`   | Boolean | `false`                       | When `true`, sets a 10 second request timeout and disables TLS certificate verification for the entire IMX Server process. |
| `VIRUS_TOTAL_URL`     | URL     | `https://www.virustotal.com/` | Base URL of Virus Total. Must end with a trailing slash.                                                                   |
| `VIRUS_TOTAL_KEY`     | String  | None                          | Virus Total API key. Must be base64 encoded; IMX decodes it before sending it to Virus Total.                              |

### MISP

Connect to MISP and query for events and attributes. The MISP integration is bi-directional: IMX can pull from MISP and convert MISP JSON to STIX 2.1, or push to MISP by converting STIX 2.1 to MISP JSON.

| Variable       | Type    | Default | Description                                                                                       |
| -------------- | ------- | ------- | ------------------------------------------------------------------------------------------------- |
| `MISP_ENABLED` | Boolean | None    | Not currently read by IMX Server.                                                                 |
| `MISP_URL`     | URL     | None    | Base URL of the MISP server. Must end with a trailing slash.                                      |
| `MISP_KEY`     | String  | None    | MISP API key, in plain text. IMX sends it unchanged in the `Authorization` header.                |
| `MISP_SSL`     | Boolean | None    | Not currently read by IMX Server. TLS certificate verification is always disabled for MISP calls. |

## License

Copyright 2026 Cybersecurity and Infrastructure Security Agency (CISA)

This software is released to the public domain under 17 U.S.C. § 105. The [Apache 2.0 License](LICENSE) applies to the extent permitted by applicable law, and for the benefit of international users.
