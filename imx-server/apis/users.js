const axios = require("axios");
const https = require("node:https");
const { getKeycloakSessionToken } = require("./keycloak");

const getKeycloakUsers = function (authHeader) {
  return new Promise(async (resolve, reject) => {
    try {
      let axiosData = {
        headers: {
          Authorization: authHeader,
        },
      };

      if (
        process.env.AUTH.includes("oidc") &&
        (process.env.OIDC_CERT === "false" || process.env.OIDC_CERT === false)
      ) {
        axiosData["httpsAgent"] = new https.Agent({
          rejectUnauthorized: false,
        });
      } else if (
        process.env.KC_CERT === "false" ||
        process.env.KC_CERT === false
      ) {
        axiosData["httpsAgent"] = new https.Agent({
          rejectUnauthorized: false,
        });
      }

      let url = `${process.env.KC_URL}admin/realms/${process.env.KC_REALM}/users`;
      if (process.env.AUTH.includes("oidc")) {
        let kc_url = process.env.OIDC_URL.replace(
          "/protocol/openid-connect",
          "",
        );
        url = `${kc_url.replace("/realms", "/admin/realms")}/users`;
      }

      axios
        .get(url, axiosData)
        .then(async (res) => {
          try {
            const users = [];

            for (let user of res.data) {
              const roles = await getKeycloakUserRoles(user, axiosData);

              users.push({
                user: user.username,
                roles: roles,
                id: user.id,
              });
            }

            return resolve(users);
          } catch (err) {
            console.error("Failed to retrieve all users for admin: ", err);
            return reject(err);
          }
        })
        .catch((err) => {
          console.error("Failed to retrieve all users for admin: ", err);
          return reject(err);
        });
    } catch (e) {
      console.error("ERROR KEYCLOAK");
      console.debug(`KC_CERT: ${process.env.KC_CERT}`);
      console.debug(`AXIOS DATA: ${JSON.stringify(axiosData)}`);
      return reject(e);
    }
  });
};

const getKeycloakUserRoles = function (user, header) {
  return new Promise(async (resolve, reject) => {
    try {
      let url = `${process.env.KC_URL}admin/realms/${process.env.KC_REALM}/users/${user.id}/role-mappings/realm`;
      if (process.env.AUTH.includes("oidc")) {
        let kc_url = process.env.OIDC_URL.replace(
          "/protocol/openid-connect",
          "",
        );
        url = `${kc_url.replace("/realms", "/admin/realms")}/users/${user.id}/role-mappings/realm`;
      }

      const result = await axios.get(url, header);

      const roles = result.data;

      const userRoles = [];

      const rolesToExclude = new Set([
        "uma_authorization",
        "default-roles-tie",
        "offline_access",
      ]);

      roles.forEach((role) => {
        if (rolesToExclude.has(role.name)) return;

        userRoles.push(role.name);
      });

      return resolve(userRoles);
    } catch (e) {
      console.error(`Failed to retrieve roles for user: ${user.username}`, e);
      return reject(e);
    }
  });
};

/**
 * Retrieve users in Keycloak based on matching roles
 * @param {string[]} roles array name of the role to search
 * @param {string} username username of the account looking up
 * @returns an array of usernames with matching roles
 */
const getKeycloakPeerUsers = function (roles, username) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getKeycloakSessionToken();
      const returnObj = {};
      const ignoreRoles = [
        "offline_access",
        "uma_authorization",
        `default-roles-${process.env.KC_REALM.toLowerCase()}`,
      ];

      for (let role of roles) {
        if (ignoreRoles.includes(role)) continue;

        let url = `${process.env.KC_URL}admin/realms/${process.env.KC_REALM}/roles/${role}/users`;

        if (process.env.AUTH.includes("oidc")) {
          let kc_url = process.env.OIDC_URL.replace(
            "/protocol/openid-connect",
            "",
          );
          url = `${kc_url.replace("/realms", "/admin/realms")}/roles/${role}/users`;
        }

        const options = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        };

        const users = await axios.get(url, options);

        if (!users?.data || !Array.isArray(users.data)) {
          throw new Error(
            "Unexpected data type returned when querying for users based on role: ",
            users.data,
          );
        }

        const returnArr = [];
        users.data.forEach((user) => {
          if (user.username !== `service-account-${process.env.KC_CLIENT_ID}`)
            returnArr.push({ user: user.username });
        });

        returnObj[role] = returnArr;
      }

      return resolve(returnObj);
    } catch (e) {
      console.error(`Failed to retrieve peer users for user ${username}`, e);
      return reject(e);
    }
  });
};

module.exports = { getKeycloakUsers, getKeycloakPeerUsers };
