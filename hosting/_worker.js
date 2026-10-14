const cataloguePath = "dist/catalogue.json";
const manifestPath =
  /^dist\/content-packs\/[a-z0-9]+(?:-[a-z0-9]+)*\/manifest-\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\.json$/u;
const blobPath = /^content-pack-blobs\/[0-9a-f]{64}$/u;

export default {
  async fetch(request, environment) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }

    const key = new URL(request.url).pathname.replace(/^\/+/, "");
    if (!isPublicPath(key)) return new Response("Not found", { status: 404 });

    const object = request.method === "HEAD"
      ? await environment.PACKS.head(key)
      : await environment.PACKS.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", cacheControlFor(key));
    headers.set("access-control-allow-origin", "*");
    headers.set("x-content-type-options", "nosniff");
    return new Response(request.method === "HEAD" ? null : object.body, { headers });
  },
};

export function isPublicPath(path) {
  return path === cataloguePath || manifestPath.test(path) || blobPath.test(path);
}

export function cacheControlFor(path) {
  return path === cataloguePath
    ? "public, max-age=60, must-revalidate"
    : "public, max-age=31536000, immutable";
}
