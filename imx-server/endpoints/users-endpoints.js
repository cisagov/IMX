const { getKeycloakUsers } = require("../apis/users");
const getUserData = require("../functions/get-user-data");
const { extractToken } = require("../functions/extract-token");

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
