const getTarget = require("../functions/get-db-data");

describe("getTarget", () => {
  const req = { params: { target: "imx" } };
  const logger = { logEndpoint: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns imx config for target imx", () => {
    process.env.DB_URL = "http://imx";
    process.env.DB_USER = "u";
    process.env.DB_PASS = "p";
    const res = getTarget(req, null, logger);
    expect(res).toEqual({ url: "http://imx", user: "u", pass: "p" });
  });

  test("returns taxii config for target taxii", () => {
    process.env.ES_TAXII_URL = "http://taxii";
    process.env.ES_TAXII_USER = "u2";
    process.env.ES_TAXII_PASS = "p2";
    process.env.ES_TAXII_CAN_WRITE = "true";
    req.params.target = "taxii";
    const res = getTarget(req, null, logger);
    expect(res).toEqual({
      url: "http://taxii",
      user: "u2",
      pass: "p2",
      can_write: "true",
    });
  });

  test("handles unknown target, logs 404 and sends message", () => {
    const mockRes = { send: jest.fn() };
    req.params.target = "unknown";
    const out = getTarget(req, mockRes, logger);
    expect(logger.logEndpoint).toHaveBeenCalledWith(404, req, undefined);
    expect(mockRes.send).toHaveBeenCalledWith({
      message: "The target in your endpoint was not found",
    });
    expect(out).toBeUndefined();
  });
});
