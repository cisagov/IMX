const getUserData = require("../functions/get-user-data");

describe("getUserData", () => {
  afterEach(() => {
    jest.resetModules();
  });

  test("uses none-auth when AUTH=none", async () => {
    process.env.AUTH = "none";
    const mockAuth = jest.fn().mockResolvedValue({ user: "none" });
    jest.doMock("../auth/none-auth", () => mockAuth);
    const result = await getUserData({
      headers: { authorization: "whatever" },
    });
    expect(mockAuth).toHaveBeenCalledWith("whatever");
    expect(result).toEqual({ user: "none" });
  });

  test("Basic auth delegates to basic-auth", async () => {
    process.env.AUTH = "basic";
    const mockBasic = jest.fn().mockResolvedValue({ user: "basic" });
    jest.doMock("../auth/basic-auth", () => mockBasic);
    const result = await getUserData({
      headers: { authorization: "Basic abc" },
    });
    expect(mockBasic).toHaveBeenCalledWith("Basic abc");
    expect(result).toEqual({ user: "basic" });
  });

  test("Bearer with oidc auth delegates to oidc-auth", async () => {
    process.env.AUTH = "oidc";
    const mockOidc = jest.fn().mockResolvedValue({ user: "oidc" });
    jest.doMock("../auth/oidc-auth", () => mockOidc);
    const result = await getUserData({
      headers: { authorization: "Bearer xyz" },
    });
    expect(mockOidc).toHaveBeenCalledWith("Bearer xyz");
    expect(result).toEqual({ user: "oidc" });
  });

  test("Bearer without oidc default to keycloak-auth", async () => {
    process.env.AUTH = "kc";
    const mockKc = jest.fn().mockResolvedValue({ user: "kc" });
    jest.doMock("../auth/keycloak-auth", () => mockKc);
    const result = await getUserData({
      headers: { authorization: "Bearer xyz" },
    });
    expect(mockKc).toHaveBeenCalledWith("Bearer xyz");
    expect(result).toEqual({ user: "kc" });
  });

  test("error falls back to req.body.user", async () => {
    process.env.AUTH = "basic";
    const mockBasic = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("../auth/basic-auth", () => mockBasic);
    const req = {
      headers: { authorization: "Basic abc" },
      body: { user: "fallback" },
    };
    const result = await getUserData(req);
    expect(result).toEqual("fallback");
  });
});
