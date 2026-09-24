const axios = require("axios");
const https = require("node:https");

const getKeycloakSessionToken = function () {
  return new Promise(async (resolve, reject) => {
    try {
      let url = `${process.env.KC_URL}realms/${process.env.KC_REALM}/protocol/openid-connect/token`;

      if (process.env.AUTH.includes("oidc")) {
        url = `${process.env.OIDC_URL}/token`;
      }

      const body = {
        grant_type: "client_credentials",
        client_id: process.env.KC_CLIENT_ID,
        client_secret: process.env.KC_CLIENT_SECRET,
      };

      let options = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      };

      const token_result = await axios.post(url, body, options);

      if (!token_result?.data?.access_token)
        throw new Error(
          "Token was not retrieved from Keycloak: ",
          token_result.data,
        );

      return resolve(token_result.data.access_token);
    } catch (e) {
      console.error("Failed to retrieve Token ", e);
      return reject(e);
    }
  });
};

module.exports = { getKeycloakSessionToken };
