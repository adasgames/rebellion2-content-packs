import assert from "node:assert/strict";
import test from "node:test";

import worker, { cacheControlFor, isPublicPath } from "./_worker.js";

test("isPublicPath allows only catalogue, versioned manifests, and hashed blobs", () => {
  assert.equal(isPublicPath("dist/catalogue.json"), true);
  assert.equal(
    isPublicPath("dist/content-packs/sample-pack/manifest-1.2.3.json"),
    true,
  );
  assert.equal(isPublicPath(`content-pack-blobs/${"a".repeat(64)}`), true);
  assert.equal(isPublicPath("dist/private.json"), false);
  assert.equal(isPublicPath("content-pack-blobs/not-a-hash"), false);
});

test("cacheControlFor keeps the catalogue fresh and immutable releases cached", () => {
  assert.match(cacheControlFor("dist/catalogue.json"), /must-revalidate/u);
  assert.match(cacheControlFor(`content-pack-blobs/${"a".repeat(64)}`), /immutable/u);
});

test("fetch rejects unsupported methods before reading R2", async () => {
  const response = await worker.fetch(new Request("https://packs.invalid/dist/catalogue.json", {
    method: "POST",
  }), {});
  assert.equal(response.status, 405);
});

test("fetch rejects paths outside the release channel", async () => {
  const response = await worker.fetch(new Request("https://packs.invalid/private"), {});
  assert.equal(response.status, 404);
});
