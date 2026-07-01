# IMX Client - Indicator Messaging eXchange

The IMX Client is the Angular frontend for IMX — a tool for creating and managing STIX-compliant reports and publishing them to a TAXII Server. It is intended to be run alongside the IMX Server.

## Development server

Before running, ensure `src/environments/env.json` is configured for your environment (see [Setting up Authentication](../README.md#setting-up-authentication) in the root README).

This project uses [Angular CLI](https://github.com/angular/angular-cli) version 20.

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Docker Deployment

IMX Client is deployed as part of the full IMX stack. Deployment is managed from the **repo root** using `docker-compose.yml` and `template.env` — see the [root README](../README.md#deployments) for setup and startup instructions.

The root README covers:
- Copying `template.env` to `.env` and configuring it
- Running `docker compose up -d` to start the full stack
- Running the Angular dev server alongside Docker backend services (skipping the containerized client with `--scale imx-client=0`)
- Setting up authentication (No Auth, Keycloak, OIDC)

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## License

Copyright 2026 Cybersecurity and Infrastructure Security Agency (CISA)

This software is released to the public domain under 17 U.S.C. § 105. The [Apache 2.0 License](LICENSE) applies to the extent permitted by applicable law, and for the benefit of international users.
