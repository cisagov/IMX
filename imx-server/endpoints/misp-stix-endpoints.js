const py = require("../apis/imx-py");
const getUserData = require("../functions/get-user-data");
const misp = require("../apis/misp");
const db = require("../database/db");

const mispStixEndpoints = function (app, logger) {
  app.post("/misp-to-stix", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);
      let misp = req.body;

      let result = await py.mispToStix(misp);

      if (result.data) {
        logger.logEndpoint(200, req, userData);
        res.send({ status: 200, data: result.data });
      } else {
        console.error("ERROR. result.data is empty: /misp-to-stix");
        logger.logEndpoint(500, req, userData);
        res.status(500).send({ status: 500, message: "No Data returned" });
      }
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, userData);
      res.status(500).send({ status: 500, message: JSON.stringify(err) });
    }
  });

  app.post("/stix-to-misp", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);
      let stix = req.body;

      let result = await py.stixToMisp(stix);

      if (result.data) {
        logger.logEndpoint(200, req, userData);
        res.send({ status: 200, data: result.data });
      } else {
        console.error("ERROR. result.data is empty: /misp-to-stix");
        logger.logEndpoint(500, req, userData);
        res.status(500).send({ status: 500, message: "No Data returned" });
      }
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, undefined);

      if (err.response?.data?.message) {
        res
          .status(500)
          .send({ status: 500, message: err.response.data.message });
      } else res.status(500).send({ status: 500, message: err });
    }
  });

  app.post("/export-misp", async (req, res) => {
    let userData;
    let docId;

    try {
      userData = await getUserData(req);
      let mispBody = req.body.json;
      let url = req.body.url;
      let api = req.body.api;
      let report = req.body.report;
      // let stix = req.body.stix;

      if (!mispBody || !url || !api || !report) {
        logger.logEndpoint(400, req, userData);
        return res.status(400).send({
          status: 400,
          message: "Missing either required fields in body",
        });
      }

      try {
        docId = await misp.addSubmission(userData.user, mispBody, url, report);
      } catch (e) {
        console.error(e);
        console.error("Failed to create submission");
      }

      const resp = await misp.addEvent(mispBody, url, api);

      if (docId && resp.status == 200) {
        try {
          await misp.updateSubmission(docId, resp.data, "Success");
        } catch (e) {
          console.error(e);
          console.error("Failed to update submission");
          console.trace();
        }
      } else if (docId && resp.status == 404 && resp.data) {
        try {
          await misp.updateSubmission(docId, resp.data, "Duplicate");
        } catch (e) {
          console.error(e);
          console.error("Failed to update submission");
          console.trace();
        }
      } else {
        try {
          await misp.updateSubmission(docId, null, "Fail");
        } catch (e) {
          console.error(e);
          console.error("Failed to update submission");
          console.trace();
        }
      }

      logger.logEndpoint(200, req, userData);
      res.status(200).send(JSON.stringify(resp.data));
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, userData);

      if (docId) {
        try {
          await misp.updateSubmission(docId, null, "Fail");
        } catch (e) {
          console.error(e);
          console.error("Failed to update submission");
        }
      }

      res.status(500).send({ status: 500, message: JSON.stringify(err) });
    }
  });

  app.post("/misp-server", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);
      let cred = req.body;

      const resp = await misp.addServer(cred.url, cred.api, userData.user);

      //Response
      if (resp?.status === 201) {
        logger.logEndpoint(201, req, userData);
        return res.status(201).send({
          status: 201,
          message: `Index and Doc posted successfully`,
          data: resp.data,
        });
      } else if (resp?.status === 200) {
        logger.logEndpoint(201, req, userData);
        return res.status(201).send({
          status: 201,
          message: `Index and Doc updated successfully`,
          data: resp.data,
        });
      } else {
        logger.logEndpoint(resp.response.status, req, userData);
        return res.status(500).send({
          status: 500,
          message: `Index created but posting doc failed`,
        });
      }
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, userData);
      return res
        .status(500)
        .send({ status: 500, message: JSON.stringify(err) });
    }
  });

  app.get("/misp-server", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);

      const resp = await misp.getServers(userData.user);

      if (resp.status === 200) {
        logger.logEndpoint(200, req, userData);
        return res.send({ status: 200, data: resp.data });
      } else {
        logger.logEndpoint(resp.status, req, userData);
        return res.status(500).send({
          status: 500,
          message: `Unexpected error: ${JSON.stringify(resp)}`,
        });
      }
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, userData);
      return res
        .status(500)
        .send({ status: 500, message: JSON.stringify(err) });
    }
  });

  // TODO
  app.delete("/misp-server/:serverId", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);
      const id = req.params.serverId;
      const resp = await misp.deleteServer(id);

      if (resp.status === 200) {
        logger.logEndpoint(resp.status, req, userData);
        return res.send({ status: 200, message: "deleted" });
      } else if (resp.status === 404) {
        logger.logEndpoint(resp.status, req, userData);
        return res.status(404).send({ status: 404, message: "doc not found" });
      } else {
        console.error(err);
        logger.logEndpoint(500, req, undefined);
        return res
          .status(500)
          .send({ status: 500, message: " Unexpected error" });
      }
    } catch (err) {
      if (err.status === 404) {
        logger.logEndpoint(err.status, req, userData);
        return res.status(404).send({ status: 404, message: "doc not found" });
      }

      console.error(err);
      logger.logEndpoint(500, req, undefined);
      return res
        .status(500)
        .send({ status: 500, message: JSON.stringify(err) });
    }
  });

  app.get("/submissions/:from/:user", async (req, res) => {
    let userData;

    try {
      userData = await getUserData(req);

      const user = req.params.user;
      const from = req.params.from;

      const resp = await misp.getSubmissions(user, from);

      if (resp.status === 404) {
        logger.logEndpoint(200, req, userData);
        return res.send({ status: 200, data: [], hasMore: false });
      } else if (resp.status === 200) {
        logger.logEndpoint(200, req, userData);
        return res.send({
          status: 200,
          data: resp.data,
          hasMore: resp.hasMore,
        });
      } else {
        console.error("Something went wrong when retrieving submissions");
        logger.logEndpoint(200, req, userData);
        return res.send({ status: 200, data: [], hasMore: false });
      }
    } catch (err) {
      console.error(err);
      logger.logEndpoint(200, req, userData);
      return res.send({ status: 200, data: [], hasMore: false });
    }
  });

  app.post("/search-misp", async (req, res) => {
    let userData;
    try {
      userData = await getUserData(req);

      const indicators = req.body.indicators;

      const result = await misp.searchEvent(indicators);

      return res.send({ status: 200, data: result });
    } catch (err) {
      console.error(err);
      logger.logEndpoint(500, req, undefined);
      return res
        .status(500)
        .send({ status: 500, message: JSON.stringify(err) });
    }
  });
};

module.exports = mispStixEndpoints;
