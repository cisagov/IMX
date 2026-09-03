const db = require("../database/db");
const { createIndex } = require("../database/elasticsearch");
const checkIndex = require("../functions/check-index");

// Mock each module and function used in check-index.js
jest.mock("../database/db", () => ({
  getIndex: jest.fn().mockResolvedValue(true),
  createIndex: jest.fn().mockResolvedValue(true),
  checkIndex: jest.fn().mockResolvedValue(true),
}));

describe("checkIndex function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("resolves when index exists", async () => {
    const expected = { status: 200 };
    db.getIndex.mockResolvedValueOnce(expected);
    const res = await checkIndex("test-index");
    expect(db.getIndex).toHaveBeenCalledWith("test-index");
    expect(res).toEqual({
      status: 200,
      message: "SUCCESS. DB index: test-index already exists",
    });
  });

  test("creates index when not found", async () => {
    const err = { status: 404 };
    const createRes = { status: 200 };
    db.getIndex.mockRejectedValueOnce(err);
    db.createIndex.mockResolvedValueOnce(createRes);
    const res = await checkIndex("missing");
    expect(db.createIndex).toHaveBeenCalledWith("missing");
    expect(res).toEqual({
      status: 200,
      message: "SUCCESS. DB index created: missing",
    });
  });

  test("rejects when createIndex fails", async () => {
    const err = { status: 404 };
    db.getIndex.mockRejectedValueOnce(err);
    db.createIndex.mockResolvedValueOnce({ status: 400 });
    await expect(checkIndex("bad")).rejects.toThrow(
      "ERROR. Unable to find or create index: bad",
    );
  });

  test("rejects for other error codes", async () => {
    const err = { status: 500 };
    db.getIndex.mockRejectedValueOnce(err);
    await expect(checkIndex("oops")).rejects.toEqual(err);
  });
});
