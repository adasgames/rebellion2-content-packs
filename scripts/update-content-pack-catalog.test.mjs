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
    basePackId: "classic-galactic-civil-war",
    basePackVersion: "1.0.0",
    compatibleGameVersions: ["0.0.31"],
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
    { schemaVersion: 1, packs: [] },
    release(),
    manifest(),
  );

  assert.equal(result.packs.length, 1);
  assert.equal(result.packs[0].downloadSize, 35);
  assert.equal(result.packs[0].version, "1.2.3");
  assert.equal(result.packs[0].basePackVersion, "1.0.0");
  assert.deepEqual(result.packs[0].compatibleGameVersions, ["0.0.31"]);
});

test("publishing a new pack version replaces only that catalog entry", () => {
  const existing = {
    schemaVersion: 1,
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
    schemaVersion: 1,
    packs: [release({ id: "other-pack", directory: "SharedDirectory" })],
  };

  assert.throws(
    () => updateContentPackCatalog(existing, release({ directory: "SharedDirectory" }), manifest()),
    /already belongs/u,
  );
});

test("catalog rejects a release without compatible game versions", () => {
  assert.throws(
    () =>
      updateContentPackCatalog(
        { schemaVersion: 1, packs: [] },
        release({ compatibleGameVersions: [] }),
        manifest(),
      ),
    /Compatible game versions/u,
  );
});

test("catalog rejects noncanonical semantic versions", () => {
  for (const version of ["01.0.0", "1.0.0-beta.01"]) {
    assert.throws(
      () =>
        updateContentPackCatalog(
          { schemaVersion: 1, packs: [] },
          release({ compatibleGameVersions: [version] }),
          manifest(),
        ),
      /semantic versions/u,
    );
  }
});

test("catalog rejects a noncanonical pack version", () => {
  for (const version of ["next", "01.0.0", "1.0.0-beta.01"]) {
    assert.throws(
      () =>
        updateContentPackCatalog(
          { schemaVersion: 1, packs: [] },
          release({ version }),
          manifest({ version }),
        ),
      /Content-pack version/u,
    );
  }
});

test("catalog requires a base pack id and version together", () => {
  assert.throws(
    () =>
      updateContentPackCatalog(
        { schemaVersion: 1, packs: [] },
        release({ basePackVersion: undefined }),
        manifest(),
      ),
    /declared together/u,
  );
});

test("catalog retains exact compatible game versions", () => {
  const result = updateContentPackCatalog(
    { schemaVersion: 1, packs: [] },
    release({ compatibleGameVersions: ["0.0.31", "0.0.32"] }),
    manifest(),
  );

  assert.deepEqual(result.packs[0].compatibleGameVersions, ["0.0.31", "0.0.32"]);
});
