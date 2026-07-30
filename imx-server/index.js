const express = require("express");
const bodyParser = require("body-parser");

//HTTPS
const https = require("node:https");
const path = require("node:path");
const fs = require("node:fs");

//StartUpScripts
const startup = require("./startup");

//Multer for file upload
const multer = require("multer");
const storage = multer.diskStorage({
  destination: path.join(__dirname, "/uploads"),
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB
  },
  storage,
  dest: path.join(__dirname, "/uploads"),
}); //single('file')
module.exports = { upload };

//App
const app = express();

//Catches uncaught exceptions preventing a server crash
process.on("uncaughtException", (err) => {
  console.error(err);
  if (err?.response?.data) console.error(err.response.data);
  console.trace();
});

//Environment Files
try {
  require("dotenv").config({
    path: `./environment/${process.env.NODE_ENV}.env`,
  });
} catch (e) {
  console.error(e);
  console.error("environment file does not exist in container");
}
try {
  const checkEnv = require("./startup/check-env");
  checkEnv();
} catch (err) {
  console.error(err);
  console.error("ERROR: Could not check env.");
}

const PORT = process.env.PORT;
const HTTPS_PORT = process.env.HTTPS_PORT;

//Logging
let logger = require(`./logging/none`);
try {
  logger = require(`./logging/${process.env.LOGGER}`);
  console.info(`SUCCESS. Using logger: ${process.env.LOGGER}`);
} catch (e) {
  console.error(e);
  console.info(`ERROR. Cannot set logger to target: ${process.env.LOGGER}`);
  logger = require(`./logging/none`);
}

//Process JSON & FormData
app.use(bodyParser.json({ limit: "50mb" }));

//CORS
const cors = require("cors");
process.env.ALLOWED_ORIGINS = JSON.parse(
  JSON.stringify(process.env.ALLOWED_ORIGINS),
);
if (process.env.CORS_ENABLED === "false") {
  app.use(cors());
  console.info("CORS DISABLED");
} else {
  let corsOptions = {
    origin: (origin, callback) => {
      if (process.env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
  console.info("CORS ENABLED");
}

//Database
let db;
try {
  db = require(`./database/db`);
  let database = db.getDb();
  console.info(`SUCCESS. Using database: ${database}`);
} catch (e) {
  console.error(e);
  console.error(`ERROR. Cannot set database to target: ${process.env.DB}`);
}

//Authentication
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.info(`ORIGIN: ${req.headers.origin}`);
  console.info(`PATH: ${req.originalUrl}`);

  if (!authHeader && process.env.AUTH !== "none") {
    logger.logAuth(401, req, undefined);

    console.info("AUTH_RES: !authHeader, Not Authenticated");
    let err = new Error("You are not authenticated!");
    err.status = 401;
    return next(err);
  }

  console.info(`AUTH: ${authHeader}`);

  try {
    let result = await require(`./auth/${process.env.AUTH}-auth`)(
      authHeader,
      process.env,
    );

    if (result.res === true) {
      console.info("AUTH_RES: Authenticated");
      logger.logAuth(200, req, result.user);
      next();
    } else if (req.originalUrl.startsWith("/logging/imx")) {
      logger.unAuthLog(req);
    } else {
      logger.logAuth(401, req, undefined);

      console.error("AUTH_RES: auth.res != true, Not Authenticated");
      let err = new Error("You are not authenticated!");
      err.status = 401;
    }
  } catch (err) {
    if (req.originalUrl.startsWith("/logging/imx")) {
      logger.unAuthLog(req);
    } else {
      console.error("catch err, Not Authenticated");
      console.error(err);
      console.trace();

      logger.logAuth(500, req, undefined);
      return next(err);
    }
  }
});

//Endpoints
const alertEndpoints = require("./endpoints/alert-endpoints")(app, logger);
const alertSubEndpoints = require("./endpoints/alert-subscription-endpoints")(
  app,
  logger,
);
const certificateEndpoints = require("./endpoints/cert-endpoints")(app, logger);
const customTaxiiEndpoints = require("./endpoints/custom-taxii-endpoints")(
  app,
  logger,
);
const envEndpoints = require("./endpoints/env-endpoints")(app, logger);
const gitlabEndpoints = require("./endpoints/gitlab-endpoints")(app, logger);
const identifyStixEndpoints = require("./endpoints/identify-STIX")(app, logger);
const imxEndpoints = require("./endpoints/imx-endpoints")(app, logger);
const loggingEndpoints = require("./endpoints/logging-endpoints")(app, logger);
const mySubmissionsEndpoints = require("./endpoints/my-submissions-endpoints")(
  app,
  logger,
);
const savedBundlesEndpoints = require("./endpoints/saved-bundles-endpoints")(
  app,
  logger,
);
const mispStixEndpoints = require("./endpoints/misp-stix-endpoints")(
  app,
  logger,
);
const disabedTaxiiEndpoints = require("./endpoints/disabled-taxii-endpoints")(
  app,
  logger,
);
const markingEndpoints = require("./endpoints/marking-group-endpoints")(
  app,
  logger,
);
const usersEndpoints = require("./endpoints/users-endpoints")(app, logger);
const stix1Endpoints = require("./endpoints/stix-1-endpoints")(app, logger);

if (process.env.VIRUS_TOTAL_ENABLED === "true") {
  require("./endpoints/virus-total-endpoints")(app, logger);
}

//Will only run these endpoints for development (contains capabilities to connect and search Database at will from endpoints. Meant for testing not production use)
if (process.env.ENV === "development") {
  require("./endpoints/db-endpoints")(app, logger);
}

if (process.env.HTTPS === "true") {
  const sslServer = https.createServer(
    {
      key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem")),
    },
    app,
  );

  sslServer.listen(HTTPS_PORT, (error) => {
    if (error) {
      console.error("Error occurred, HTTPS server can't start", error);
    } else {
      console.info(
        `${process.env.NODE_ENV} Server is running. using HTTPS, and listening on port ${HTTPS_PORT}`,
      );
    }
  });
} else {
  //Sets up server to listen at port 3000
  app.listen(PORT, (error) => {
    if (error) {
      console.error("Error occurred, HTTP server can't start", error);
    } else {
      console.info(
        `${process.env.NODE_ENV} Server is running in ${process.env.ENV} mode. using HTTP, and listening on port ${PORT}`,
      );
    }
  });
}

try {
  const startup = require("./startup");
  if (process.env.STARTUP === "true") {
    setTimeout(() => {
      startup.start();
    }, 500);
  }
} catch (err) {
  console.error(err);
  console.error(
    "ERROR: Issue occurred while attempting to run startup scripts.",
  );
}

//Cron Jobs
const cronHealthchecks = require("./cronjobs/healthckecks");
const cronLogRetention = require("./cronjobs/log-retention");
const cronSmtp = require("./cronjobs/smtp");

if (process.env.HEALTHCHECKS && process.env.HEALTHCHECKS === "enabled") {
  console.info("SUCCESS: Cron Healthchecks are enabled");
  console.info("Logging healthchecks set to: " + process.env.LOG_HEALTHCHECKS);
  console.info(
    "Alerting healthchecks set to: " + process.env.ALERT_HEALTHCHECKS,
  );
  cronHealthchecks();
}
cronLogRetention();
cronSmtp();

module.exports = { upload };
