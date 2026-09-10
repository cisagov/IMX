const db = require("../database/db");
const kibana = require("../apis/kibana");
const logger = require(`../logging/${process.env.LOGGER}`);
const taxii = require("../apis/taxii-server");
const py = require("../apis/imx-py");
const tika = require("../apis/tika");
const a1 = require("../apis/analyst1");
const vt = require("../apis/virus-total");
const esLogger = require("../logging/elasticsearch");
const checkIndex = require("../functions/check-index");
const testConnections = require("../startup/test-connections");

// Mock each module and function used in test-connections.js
jest.mock("../database/db", () => ({
  check: jest.fn().mockResolvedValue(true),
}));
jest.mock("../apis/kibana", () => ({
  testConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock(`../logging/${process.env.LOGGER}`, () => ({
  testConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock("../apis/taxii-server", () => ({
  testConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock("../apis/imx-py", () => ({
  testConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock("../apis/tika", () => ({
  testConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock("../apis/analyst1", () => ({
  testConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock("../apis/virus-total", () => ({
  testConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock("../logging/elasticsearch", () => ({
  logHealthCheckResult: jest.fn().mockResolvedValue("logged"),
  logHealthCheckError: jest.fn().mockRejectedValue("ERROR"),
}));
jest.mock("../functions/check-index", () => jest.fn().mockResolvedValue(true));

describe("testConnections module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...process.env }; // reset env
  });

  test("DB connection success when DB_URL set", async () => {
    process.env.DB_URL = "mongodb://localhost";
    db.check.mockResolvedValue();
    const res = await testConnections();
    expect(db.check).toHaveBeenCalled();
    expect(res.successfulConnections).toContain("db");
  });

  test("DB connection failure logs error and marks as ERROR", async () => {
    process.env.DB_URL = "mongodb://localhost";
    const err = new Error("ERROR");
    db.check.mockRejectedValue(err);
    const res = await testConnections();
    expect(res.failedConnections).toContain("db");
  });

  test("Kibana returns N/A when KIBANA_ENABLED not true", async () => {
    process.env.KIBANA_ENABLED = "false";
    const res = await testConnections();
    expect(res.naConnections).toContain("kibana");
  });

  test("Taxii testConnection call with config URL trimmed", async () => {
    process.env.TAXII_URL = "http://taxii.example/taxii/v2.1-os/";
    process.env.TAXII_USER = "u";
    process.env.TAXII_PASS = "p";
    taxii.testConnection.mockResolvedValueOnce();
    const res = await testConnections();
    const expectedConfig = {
      url: "http://taxii.example/taxii/v2.1-os/",
      user: "u",
      pass: "p",
    };
    expect(taxii.testConnection).toHaveBeenCalledWith(expectedConfig);
    expect(res.successfulConnections).toContain("taxii");
  });

  test("All connections return N/A when env vars empty", async () => {
    process.env.DB_URL = "";
    process.env.KIBANA_ENABLED = "false";
    process.env.TAXII_URL = "";
    process.env.IMX_PY_URL = "";
    process.env.TIKA_URL = "";
    process.env.A1_ENABLED = "false";
    process.env.VIRUS_TOTAL_ENABLED = "false";
    const res = await testConnections();
    expect(res.naConnections.sort()).toEqual([
      "a1",
      "ais",
      "db",
      "kibana",
      "py",
      "taxii",
      "tika",
      "vt",
    ]);
  });
});
