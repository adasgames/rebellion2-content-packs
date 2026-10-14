import assert from "node:assert/strict";
import test from "node:test";

import { updateContentPackCatalog } from "./update-content-pack-catalog.mjs";

function release(overrides = {}) {
  return {
    id: "sample-pack",
    name: "Sample Pack",
    description: "A sample.",
    version: "1.2.3",
    directory: "SamplePack",
    manifest: "dist/content-packs/sample-pack/manifest-1.2.3.json",
    blobs: "content-pack-blobs/",
    depends: {
      rebellion2: ">=0.0.31",
      "classic-galactic-civil-war": "1.0.0",
    },
    ...overrides,
  };
}

function manifest() {
  return {
    version: "1.2.3",
    files: [
      { path: "pack.xml", sha256: "a", size: 10 },
      { path: "Data/units.xml", sha256: "b", size: 25 },
    ],
  };
}

test("catalog records one independently versioned pack and its size", () => {
  const result = updateContentPackCatalog(
    { schemaVersion: 2, packs: [] },
    release(),
    manifest(),
  );

  assert.equal(result.packs.length, 1);
  assert.equal(result.packs[0].downloadSize, 35);
  assert.equal(result.packs[0].version, "1.2.3");
  assert.equal(result.schemaVersion, 2);
  assert.deepEqual(result.packs[0].depends, {
    rebellion2: ">=0.0.31",
    "classic-galactic-civil-war": "1.0.0",
  });
});

test("publishing a new pack version replaces only that catalog entry", () => {
  const existing = {
    schemaVersion: 2,
    packs: [release(), release({ id: "other-pack", name: "Other", directory: "OtherPack" })],
  };

  const result = updateContentPackCatalog(
    existing,
    release({ version: "2.0.0", manifest: "dist/content-packs/sample-pack/manifest-2.0.0.json" }),
    { ...manifest(), version: "2.0.0" },
  );

  assert.equal(result.packs.length, 2);
  assert.equal(result.packs.find((pack) => pack.id === "sample-pack").version, "2.0.0");
  assert.equal(result.packs.find((pack) => pack.id === "other-pack").version, "1.2.3");
});

test("catalog rejects a directory owned by another pack", () => {
  const existing = {
    schemaVersion: 2,
    packs: [release({ id: "other-pack", directory: "SharedDirectory" })],
  };

  assert.throws(
    () => updateContentPackCatalog(existing, release({ directory: "SharedDirectory" }), manifest()),
    /already belongs/u,
  );
});

test("catalog rejects a release without a rebellion2 dependency", () => {
  assert.throws(
    () =>
      updateContentPackCatalog(
        { schemaVersion: 2, packs: [] },
        release({ depends: { "classic-galactic-civil-war": "1.0.0" } }),
        manifest(),
      ),
    /depend on rebellion2/u,
  );
});

test("catalog rejects malformed dependency requirements", () => {
  for (const requirement of ["", ">=", "^0.0.31", "01.0.0"]) {
    assert.throws(
      () =>
        updateContentPackCatalog(
          { schemaVersion: 2, packs: [] },
          release({ depends: { rebellion2: requirement } }),
          manifest(),
        ),
      /dependency requirement/u,
    );
  }
});

test("catalog rejects a noncanonical pack version", () => {
  for (const version of ["next", "01.0.0", "1.0.0-beta.01"]) {
    assert.throws(
      () =>
        updateContentPackCatalog(
          { schemaVersion: 2, packs: [] },
          release({ version }),
          manifest({ version }),
        ),
      /Content-pack version/u,
    );
  }
});

test("catalog retains bounded and alternative dependency ranges", () => {
  const result = updateContentPackCatalog(
    { schemaVersion: 2, packs: [] },
    release({
      depends: {
        rebellion2: [">=0.0.31 <0.0.35", ">=0.0.40"],
        "classic-galactic-civil-war": "1.0.0",
      },
    }),
    manifest(),
  );

  assert.deepEqual(result.packs[0].depends.rebellion2, [
    ">=0.0.31 <0.0.35",
    ">=0.0.40",
  ]);
});

test("catalog migrates untouched schema-one entries to dependency requirements", () => {
  const legacy = release({
    id: "legacy-pack",
    name: "Legacy",
    directory: "LegacyPack",
    depends: undefined,
    basePackId: "classic-galactic-civil-war",
    basePackVersion: "1.0.0",
    compatibleGameVersions: ["0.0.30", "0.0.31"],
  });

  const result = updateContentPackCatalog(
    { schemaVersion: 1, packs: [legacy] },
    release(),
    manifest(),
  );

  assert.deepEqual(result.packs.find((pack) => pack.id === "legacy-pack").depends, {
    rebellion2: ["0.0.30", "0.0.31"],
    "classic-galactic-civil-war": "1.0.0",
  });
});
