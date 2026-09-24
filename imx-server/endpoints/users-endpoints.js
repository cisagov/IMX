const { getKeycloakUsers, getKeycloakPeerUsers } = require("../apis/users");
const getUserData = require("../functions/get-user-data");
const { extractToken } = require("../functions/extract-token");
const { decode } = require("node:punycode");

const usersEndpoints = function (app, logger) {
  app.get("/sso-users", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);

      const authHeader = req.headers.authorization;
      const decodedToken = extractToken(authHeader);

      if (!userData.admin) {
        console.log("User is not admin, " + userData);
        res.status(401).send({ status: 401, message: "User is not an admin" });
      }

      let users = [];
      if (process.env.AUTH === "keycloak" || process.env.AUTH === "hybrid")
        users = await getKeycloakUsers(authHeader);
      else if (process.env.AUTH.includes("oidc")) {
        //OIDC DOES NOT HAVE AN API FOR GETTING ALL USERS
        //EVERY OIDC PROVIDER DOES THIS DIFFERENTLY
        //SWITCH STATEMENT DETERMINES OIDC PROVIDER
        //BASED OFF PROVIDER CALLS API TO GET ALL USERS
        //IF ISSUER DOES NOT HAVE A CASE IN SWITCH STATEMENT IT IS CURRENTLY NOT SUPPORTTED FOR THE FEATURE
        switch (determineIssuer(decodedToken)) {
          case "keycloak":
            users = await getKeycloakUsers(authHeader);
            break;
          default:
            console.info("OIDC ISSUER IS CURRENTLY NOT SUPPORTED");
        }
      }

      return res.send({ status: 200, data: users });
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, userData);
      res.status(500).send({ status: 500, message: JSON.stringify(err) });
    }
  });

  /**
   * /users/{role}
   * Retrieve users associated with given role
   *
   * @param req.params.role the realm role to search users within
   * @returns { status: number, data: any }
   */
  app.get("/role/users", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);

      const authHeader = req.headers.authorization;
      const decodedToken = extractToken(authHeader);

      console.log(decodedToken);
      let users = [];

      if (!decodedToken || !decodedToken.groups) {
        return res.status(500).send({
          status: 500,
          message: "No groups associated with user",
        });
      }

      if (process.env.AUTH === "keycloak" || process.env.AUTH === "hybrid") {
        users = await getKeycloakPeerUsers(
          decodedToken.groups,
          decodedToken.preferred_username,
        );
      } else if (process.env.AUTH.includes("oidc")) {
        switch (determineIssuer(decodedToken)) {
          case "keycloak":
            users = await getKeycloakPeerUsers(
              decodedToken.groups,
              decodedToken.preferred_username,
            );
            break;
          default:
            console.info("OIDC ISSUER IS CURRENTLY NOT SUPPORTED");
        }
      } else {
        console.info("Keycloak or OIDC not enabled");
        return res.status(500).send({
          status: 500,
          message: "Endpoint is not valid, keycloak/OIDC is disabled",
        });
      }

      return res.send({ status: 200, data: users });
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, userData);
      res.status(500).send({ status: 500, message: JSON.stringify(err) });
    }
  });
};

const determineIssuer = function (token) {
  if (process.env.OIDC_URL.includes("realms")) {
    return "keycloak";
  } else if (process.env.OIDC_URL.includes("cognito")) {
    return "cognito";
  } else if (process.env.OIDC_URL.includes("microsoftonline")) {
    return "microsoft";
  } else if (process.env.OIDC_URL.includes("okta")) {
    return "okta";
  } else if (process.env.OIDC_URL.includes("google")) {
    return "google";
  } else if (process.env.OIDC_URL.includes("auth0")) {
    return "auth0";
  }

  if (token.sub && token.sub.includes("auth0")) return "auth0";

  return "unsupported";
};

module.exports = usersEndpoints;
