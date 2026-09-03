const { logEndpoint, logAuth } = require("../functions/send-logs");

describe("send-logs", () => {
  const mockLogger = { emit: jest.fn() };
  const req = {
    originalUrl: "/path",
    params: { id: 1 },
    headers: { authorization: "Bearer abc" },
  };

  test("logEndpoint emits when userData provided", async () => {
    await logEndpoint(200, req, null, mockLogger, { user: "alice" });
    expect(mockLogger.emit).toHaveBeenCalledWith("endpoint", {
      status: 200,
      path: "/path",
      params: { id: 1 },
      user: "alice",
    });
  });

  test.skip("logEndpoint fetches userData if missing", async () => {
    const getUserData = jest.fn().mockResolvedValue({ user: "bob" });
    jest.doMock("../functions/get-user-data", () => getUserData);
    //const { logEndpoint: logEP } = require("../functions/send-logs");
    await logEndpoint(404, req, null, mockLogger, "");
    expect(getUserData).toHaveBeenCalledWith(req, "");
    expect(mockLogger.emit).toHaveBeenCalledWith("endpoint", {
      status: 404,
      path: "/path",
      params: { id: 1 },
      user: "bob",
    });
  });

  test("logAuth emits auth log", () => {
    logAuth(401, req, { user: "carol" }, mockLogger);
    expect(mockLogger.emit).toHaveBeenCalledWith("auth", {
      status: 401,
      path: "/path",
      headers: { authorization: "Bearer abc" },
      user: { user: "carol" },
    });
  });
});
