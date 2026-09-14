const createSortObj = require("../functions/create-sort-obj");

describe("createSortObj", () => {
  test("na returns created_timestamp desc", () => {
    expect(createSortObj("na")).toEqual({ "@created_timestamp": "desc" });
  });

  test("modified-date sorts by modified_date asc/desc", () => {
    expect(createSortObj("modified-asc")).toEqual({ modified_date: "asc" });
    expect(createSortObj("modified-desc")).toEqual({ modified_date: "desc" });
  });

  test("created-time sorts by created_date", () => {
    expect(createSortObj("created-asc")).toEqual({ created_date: "asc" });
  });

  test("string sort key uses .keyword field", () => {
    expect(createSortObj("name-asc-string")).toEqual({ "name.keyword": "asc" });
  });

  test("generic sort key uses raw field", () => {
    expect(createSortObj("score-desc")).toEqual({ score: "desc" });
  });
});
