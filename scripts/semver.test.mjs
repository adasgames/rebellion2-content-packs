import assert from "node:assert/strict";
import test from "node:test";

import {
  compareSemanticVersions,
  isVersionRequirement,
  satisfiesVersionRequirement,
} from "./semver.mjs";

test("compareSemanticVersions orders stable numeric versions", () => {
  assert.equal(compareSemanticVersions("1.2.3", "1.2.2"), 1);
  assert.equal(compareSemanticVersions("1.2.3", "1.2.3"), 0);
  assert.equal(compareSemanticVersions("1.2.3", "2.0.0"), -1);
});

test("compareSemanticVersions orders prereleases before stable releases", () => {
  assert.equal(compareSemanticVersions("1.0.0-beta.2", "1.0.0-beta.1"), 1);
  assert.equal(compareSemanticVersions("1.0.0-beta", "1.0.0"), -1);
});

test("compareSemanticVersions ignores build metadata", () => {
  assert.equal(compareSemanticVersions("1.0.0+build.2", "1.0.0+build.1"), 0);
});

test("compareSemanticVersions preserves arbitrary numeric precision", () => {
  assert.equal(
    compareSemanticVersions(
      "9007199254740993.0.0",
      "9007199254740992.0.0",
    ),
    1,
  );
  assert.equal(
    compareSemanticVersions(
      "1.0.0-beta.9007199254740993",
      "1.0.0-beta.9007199254740992",
    ),
    1,
  );
});

test("compareSemanticVersions rejects invalid leading zeroes", () => {
  assert.throws(() => compareSemanticVersions("01.0.0", "1.0.0"));
  assert.throws(() => compareSemanticVersions("1.0.0-beta.01", "1.0.0"));
});

test("satisfiesVersionRequirement supports exact and bounded ranges", () => {
  assert.equal(satisfiesVersionRequirement("0.0.31", "0.0.31"), true);
  assert.equal(satisfiesVersionRequirement("0.0.31", ">=0.0.31 <0.0.40"), true);
  assert.equal(satisfiesVersionRequirement("0.0.39", ">=0.0.31 <0.0.40"), true);
  assert.equal(satisfiesVersionRequirement("0.0.40", ">=0.0.31 <0.0.40"), false);
});

test("satisfiesVersionRequirement treats arrays as alternative ranges", () => {
  const requirement = [">=0.0.31 <0.0.35", ">=0.0.40"];

  assert.equal(satisfiesVersionRequirement("0.0.33", requirement), true);
  assert.equal(satisfiesVersionRequirement("0.0.37", requirement), false);
  assert.equal(satisfiesVersionRequirement("0.0.40", requirement), true);
});

test("isVersionRequirement rejects unsupported or malformed constraints", () => {
  for (const requirement of ["", [], ">=", "^0.0.31", "01.0.0", [">=0.0.31", ""]]) {
    assert.equal(isVersionRequirement(requirement), false);
  }
});
