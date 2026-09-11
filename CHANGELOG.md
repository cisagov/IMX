## 4.19.11 (2026-09-11)

### Bug Fixes

* fix guided Email Message multipart edit and save, show collection name not id 9d80477

## 4.19.10 (2026-09-08)

### Bug Fixes

* fix login-logout loop with oidc ae966dd
* revert login-logout fix and disable logging out when changing pages a0c8859

## 4.19.9 (2026-09-02)

### Bug Fixes

* fix misp to use value instead of searchall 1ffb6c0

## 4.19.8 (2026-09-02)

### Bug Fixes

* oidc refresh token 7f0624f
* return correct expired value for the user (oidc) 0c48d81

## 4.19.7 (2026-09-02)

### Bug Fixes

* delete on search page restored for oidc a614358
* patch imx client browserslist ca1e685

## 4.19.6 (2026-09-01)

### Bug Fixes

* allow identity organization objects to be processed correctly 8b10390
* bug fixes to object editing in guided 6b31c65

## 4.19.5 (2026-08-25)

### Bug Fixes

* sso users for oidc keycloak 1151731

## 4.19.4 (2026-08-25)

### Bug Fixes

* reorganized build context to mount changelog 9e901bf

## 4.19.3 (2026-08-25)

### Bug Fixes

* fix undefined error if tag is not present 33bc57d
* report name not changing when importing from search page 54147fe
* spec version not properly setting itself to readonly fe8600f

## 4.19.2 (2026-08-24)

### Bug Fixes

* update nginx max body size limit for imx server d762733

## 4.19.1 (2026-08-24)

### Bug Fixes

* added contact information field back in standard 8c0096a
* change sector to a multi dropdown selection 03da6ba
* fixed guided organization identity bug and added extension support ea3e55c

## 4.19.0 (2026-08-21)

### Features

* release notes in the help icon 28d1e60

### Bug Fixes

* revert formatonsave back to true 37f28bd
* update client changelog 6311ded

## 4.18.1 (2026-08-21)

### Bug Fixes

* update get kc users if only oidc c0c6603

## 4.18.0 (2026-08-21)

### Features

* allow IOB editing using the custom obj form 8e48694

## 4.17.3 (2026-08-21)

### Bug Fixes

* cleanup oidc implementation ca47a3a
* ng update angular cli v20.3.27 cd04ac3
* ng update angular core v20.3.27 889889b
* npm audit fix client 52ef27c

## 4.17.2 (2026-08-13)

### Bug Fixes

* updated URL intel summary tab + few other things 3cbf6eb

## 4.17.1 (2026-08-13)

### Bug Fixes

* adjust guided identity extension to accept multiple contact information objects c48ca8e
* adjust standard identity extension to accept multiple contact information objects f4439db
* allow editing contact information in guided, styling adjustments fc53cb6
* preserve observables to persist after identity object creation 7c78875
* remove the extension array if no extensions are left b779636

## 4.17.0 (2026-08-13)

### Features

* implement wildcard search for misp integration e41d029

## 4.16.0 (2026-08-13)

### Features

* added IOB support to editor & search e1f4d13

## 4.15.0 (2026-08-07)

### Features

* note stix object for whois data on ip/domain searches 7b18683

### Bug Fixes

* re-rendering issue for openObjectViewerModal fxn ad2e8ab
* updated flow for ref obj import from modal & fixed whitespace in row 17c1aa1

## 4.14.4 (2026-08-07)

### Bug Fixes

* fix loading indicator not showing up when switching from guided to editor on startup f19caa6
* initialize to start loading on page refresh 90f1432

## 4.14.3 (2026-08-07)

### Bug Fixes

* download new bundle a83dacc
* rerendering issue on analyst1 and duplicate object removal 606c888

## 4.14.2 (2026-08-07)

### Bug Fixes

* make opensearch the default db 723bf64

## 4.14.1 (2026-08-04)

### Bug Fixes

* fix various bugs in guided observable 0bf4f0c

## 4.14.0 (2026-08-04)

### Features

* adding integrations column options for URL objects 057dc7a

## 4.13.0 (2026-08-03)

### Features

* added a few obj for dup searching, added external-id for mitre 080179a
* checking duplicated objects against default taxii 1a66b26
* implement identity contact information stix extension support in standard f89a01a
* rework of the Dup Obj UI + bug fixes f8ecdff

### Bug Fixes

* added placeholder text for new input types 3f4b03a
* placeholder text fix for non-mixed types 454671f
* refactor standard and guided forms to match bootstrap standard styling 20bd85c

## 4.12.0 (2026-07-31)

### Features

* add iob extension definitions b621244

### Bug Fixes

* fix misp json structure 2504df3
* fix reference link in schema 2f31427
* update all common schemas 6b8038a
* update validator to use updated schemas 770af47

## 4.11.4 (2026-07-30)

### Bug Fixes

* fix filter in search tab breaking due to obsolete env variable 7b02a61

## 4.11.3 (2026-07-30)

### Bug Fixes

* patches related to sonar qube findings 3931458
* unremoved if statement breaking categorization e8baa9c

## 4.11.2 (2026-07-30)

### Bug Fixes

* stix 2.1 text generation to include disclaimer if provided in env variable 74156fb

## 4.11.1 (2026-07-29)

### Bug Fixes

* if userRoles empty on isAdmin search page, try again d4471e6

## 4.11.0 (2026-07-28)

### Features

* create STIX objects from URL searching on VT modal 34bb001
* reworked STIX obj tab to group by indicator searched 7c4bcbd

### Bug Fixes

* preserve URL fragments/query strings when extracting indicators from free-text 8f9e62b

## 4.10.2 (2026-07-28)

### Bug Fixes

* reinitiated helm chart for review. Cleaned up some relevant env vars 3692ace

## 4.10.1 (2026-07-24)

### Bug Fixes

* pattern matching for stix 1.1 indicator to also account for AND operators 8cf46f5

## 4.10.0 (2026-07-24)

### Features

* add loading modal for reference checks, allow users to cancel out of the reference checking bec36f9

### Bug Fixes

* extension-type should be extension_type for identity contact extension d4c9062
* extension-type typo fix for identity contact extension e534d0a
* show export to misp button in publish modal for all deployments 19b4eff
* stix 1.1 indicator to include indicators that has AND or OR operator without parentheses 24ef407

## 4.9.1 (2026-07-24)

### Bug Fixes

* patch imx py image for openshift 8232e82

## 4.9.0 (2026-07-23)

### Features

* added console messages section VT URL results f2b6b47
* enriching URL VT search results, some clean up fd42789
* initial commit of URL searching on virustotal integration eb18c45

### Bug Fixes

* moving some text on VT results page ba4aaf7
* updated Intel Summary for URLs to conform to info from Fusion cbfa908

## 4.8.2 (2026-07-23)

### Bug Fixes

* restyle standard ui to match guided styling 1b7b109

## 4.8.1 (2026-07-21)

### Bug Fixes

* decider integration again b62a104

## 4.8.0 (2026-07-21)

### Features

* show loading indicator when processing uploaded file 8a4d4f2

### Bug Fixes

* update old sdo schemas to the most updated schemas d0ac892

## 4.7.0 (2026-07-21)

### Features

* add all common extension definition schemas for validation f7963ea
* add predefined stix1x extensions for schema validation 34df546
* add vulnerability predefined extension-definition schema validation dec58a9

### Bug Fixes

* decider tool integration patched cd0ae45
* update stix visualizer to the most up to date version e8be9e5
* upgrade axios and adm-zip for imx-server 252127d

## 4.6.0 (2026-07-21)

### Features

* add all common extension definition schemas for validation 004d0cb
* add predefined stix1x extensions for schema validation 47f611b
* add vulnerability predefined extension-definition schema validation a39e2a0

## 4.5.3 (2026-07-17)

### Bug Fixes

* update stix visualizer to the most up to date version ef2bed9

## 4.5.2 (2026-07-14)

### Bug Fixes

* refactor guided identity form to define objects with property extension 3dbc92a

## 4.5.1 (2026-07-07)

### Bug Fixes

* add user friendly values to reference objects in standard dropdowns 6d5b839

## 4.5.0 (2026-07-02)

### Features

* integration column for domain, error handling & safety checks, caching for domains 24994be

## 4.4.3 (2026-07-02)

### Bug Fixes

* move currency codes into its own model ef094dc
* refactor the standard impact form to use input fields instead of modal 8002c8e

## 4.4.0 (2026-06-30)

### Features

* add pap and iep extension definition schema for validation 5c64f0b
* file archive extension schema validation added 8b54158

## 4.3.1 (2026-06-30)

### Bug Fixes

* refactor the impact form to use extension input fields instead of modal 1f88ac1

## 4.3.0 (2026-06-30)

### Features

* add domain results, download options, and loading indicator fix 9b97116
* domain searching generates stix objects e044605
