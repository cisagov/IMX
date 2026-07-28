# IMX-Server - Indicator Messaging eXchange

The IMX Server is a backend companion to the IMX Client. It handles several backend tasks for the IMX Client: communicating with a configured GitLab instance, organizing, creating, and retrieving data for several features (can be set up with any database, currently only supports Elasticsearch).

## Getting setup for Development

Before starting, ensure dependencies are running and your environment file is configured — see the root README for setup instructions.

From the `imx-server/` directory, install dependencies and start the server:

```
npm install
npm run dev
```

The `dev` script sets `NODE_ENV=development`, which tells the server to load `development.env`. To use a different environment, create a matching `.env` file and add a corresponding script to `package.json` with the same `NODE_ENV` prefix.

To confirm the server is running (assumes No Auth mode):

```
curl http://localhost:3000
```

## Authentication

There are three options to authenticate to the IMX Backend Server. All of which can be configured using the environment file. Specifics below:

1. **Basic Authentication**
   - Set `AUTH` to `'basic'`.
   - Set `BASIC_USER` and `BASIC_PASS` to whichever username and password you wish to use for the environment.
   - When making a curl or HTTP call to the server, specify credentials like so: `"user:pass"` in the authorization header.

2. **Keycloak Authentication**
   - Set `AUTH` to `'keycloak'`.
   - Set `KC_URL` to the target Keycloak server.
   - Set `KC_REALM` to the target realm that the client is using.
   - Set `KC_CERT` to `false` for any Keycloak instance that uses a self-signed cert.
   - This uses the bearer token received on the client, which is then sent to the IMX Backend Server on every HTTP call. The server validates that token with the Keycloak server specified in the environment file.

3. **Hybrid Authentication**
   - Set `AUTH` to `'hybrid'`.
   - This uses both basic and Keycloak authentication. Reference the authentication methods above for how those work.
   - If the IMX Backend Server receives an authorization header beginning with `'Basic'` it uses basic auth; if the header begins with `'Bearer'` it uses Keycloak.

## HTTPS

For HTTPS setup be sure to include cert.pem and key.pem files in a folder called "cert" in the imx-server directory and set the "HTTPS" variable in the respective environment file to true.

## STIX Objects Text parsing

In order to leverage the IMX Server's text parsing functionality to identify STIX Observables make a POST request to the end point `${YOUR IMX SERVER DOMAIN/IP HERE}/identify-stix` with the Headers: `{'Content-Type': 'application/json'}` along with the appropriate Authorization headers and the text to be parsed located in the request body as a JSON object such as: `{ text: ${YOUR TEXT HERE}}`

If there are no issues, you can expect a JSON object back with the STIX objects identified in an array under objects.

## License

Copyright 2026 Cybersecurity and Infrastructure Security Agency (CISA)

This software is released to the public domain under 17 U.S.C. § 105. The [Apache 2.0 License](LICENSE) applies to the extent permitted by applicable law, and for the benefit of international users.
