const errorHandler = require("../functions/error-handler");

describe("errorHandler", () => {
  const logger = { logEndpoint: jest.fn() };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  const req = { originalUrl: "/test/url" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("handles axios error with response data", () => {
    const err = { status: 400, reason: "undefined" };
    errorHandler(err, req, res, logger);
    expect(logger.logEndpoint).toHaveBeenCalledWith(400, req, undefined);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "undefined" });
  });

  test("handles custom error with status and reason", () => {
    const err = { status: 401, reason: "unauth" };
    errorHandler(err, req, res, logger);
    expect(logger.logEndpoint).toHaveBeenCalledWith(401, req, undefined);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "unauth" });
  });

  test("handles generic error, sends 500", () => {
    const err = { status: 501 };
    errorHandler(err, req, res, logger);
    expect(logger.logEndpoint).toHaveBeenCalledWith(500, req, undefined);
    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.send).toHaveBeenCalledWith({
      message: "Unexpected error encountered",
    });
  });
});
