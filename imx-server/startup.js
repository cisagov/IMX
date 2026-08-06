//NPM
const axios = require("axios");
const https = require("node:https");
const HttpsProxyAgent = require("https-proxy-agent");

//APIs
const kibana = require("./apis/kibana");
const db = require("./database/db");

//STARTUP Functions
const testConnections = require("./startup/test-connections");
const refactorDB = require("./startup/refactor-db");
const testSmtp = require("./startup/test-smtp");

/**
 * Startup function (RUN AT SERVER START)
 */
const start = async function () {
  let connectionsRes = await testConnections();
  console.info("HEALTHCHECKS RESULTS:");
  console.info(connectionsRes);

  //SMTP test on startup
  try {
    if (process.env.SMTP_HOST !== "") await testSmtp();
  } catch (err) {
    console.error(err);
    console.error("Error testing SMTP");
  }

  //Kibana and related dashboard things
  try {
    if (process.env.KIBANA_ENABLED && process.env.KIBANA_ENABLED === "true")
      await kibana.setupKibana();
  } catch (err) {
    console.error(err);
    console.error("Error setting up Kibana");
  }

  //DB snapshot repo startup
  try {
    if (
      process.env.DB_SNAPSHOTS_ENABLED &&
      process.env.DB_SNAPSHOTS_ENABLED === "true" &&
      process.env.DB_URL !== ""
    ) {
      await db.createSnapshotRepo("imx-snapshots");
    }
  } catch (err) {
    console.error(err);
    if (err.response?.data) console.error(err.response.data);
    console.error("ERROR setting up DB snapshots repo");
  }

  // Check DB
  try {
    if (process.env.DB_URL !== "") {
      await refactorDB.start();
    }
  } catch (err) {
    console.error(err);
    console.error("ERROR refactoring DB");
  }
};

//All functions that are being exported
module.exports = { start };
