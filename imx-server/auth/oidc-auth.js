const { extractToken } = require("../functions/extract-token");
const axios = require("axios");
const https = require("node:https");

const oidcAuth = function (authHeader) {
  return new Promise((resolve, reject) => {
    //Contains any and all axios required headers, data, etc.
    //Required if needed to add things like the httpsAgent below (don't want to add it for everything)
    let axiosData = {
      headers: {
        Authorization: authHeader,
      },
    };

    //Adds rejectUnauthorized call if false
    if (process.env.OIDC_CERT === "false" || process.env.OIDC_CERT === false) {
      axiosData["httpsAgent"] = new https.Agent({ rejectUnauthorized: false });
    }
    console.info("OIDC URL: " + `${process.env.OIDC_URL}/userinfo`);
    //Sends request to target keycloak from environment file with user info from the auth header in request
    axios
      .get(`${process.env.OIDC_URL}/userinfo`, axiosData)
      .then((res) => {
        let decodedToken = extractToken(authHeader);
        let userRoles = getRoles(decodedToken);

        if (res.status === 200) {
          let result = {
            res: true,
            user: res.data[`${process.env.OIDC_USER_FIELD}`]
              ? res.data[`${process.env.OIDC_USER_FIELD}`]
              : undefined,
            admin: userRoles ? userRoles.includes("imx-admin") : false,
          };
          resolve(result);
        } else {
          let result = {
            res: false,
            user: res.data[`${process.env.OIDC_USER_FIELD}`]
              ? res.data[`${process.env.OIDC_USER_FIELD}`]
              : undefined,
            admin: userRoles ? userRoles.includes("imx-admin") : false,
          };
          resolve(result);
        }
      })
      .catch((err) => {
        console.error("ERROR AUTH OIDC");
        reject(err);
      });
  });
};

const getRoles = function (payload) {
  if (payload?.roles) {
    return payload.roles;
  } else if (payload?.realm_access?.roles) {
    return payload.realm_access.roles;
  } else {
    return [];
  }
};

module.exports = oidcAuth;
