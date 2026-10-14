import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const semanticVersion = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const safeDirectory = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const packsRoot = path.join("Content", "Packs");

const registryFiles = (await readdir("packs"))
  .filter((file) => file.endsWith(".json"))
  .sort();
const directories = (await readdir(packsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const registeredDirectories = new Set();
const registeredIds = new Set();
for (const registryFile of registryFiles) {
  const registry = JSON.parse(await readFile(path.join("packs", registryFile), "utf8"));
  requireValue(slug.test(registry.id), `${registryFile} has an invalid id.`);
  requireValue(registryFile === `${registry.id}.json`, `${registryFile} does not match its id.`);
  requireValue(registry.name?.trim(), `${registryFile} has no display name.`);
  requireValue(registry.description?.trim(), `${registryFile} has no description.`);
  requireValue(
    safeDirectory.test(registry.directory) && ![".", ".."].includes(registry.directory),
    `${registryFile} has an unsafe directory.`,
  );
  requireValue(!registeredIds.has(registry.id), `Duplicate pack id ${registry.id}.`);
  requireValue(
    !registeredDirectories.has(registry.directory.toLowerCase()),
    `Duplicate pack directory ${registry.directory}.`,
  );
  registeredIds.add(registry.id);
  registeredDirectories.add(registry.directory.toLowerCase());

  const packXmlPath = path.join(packsRoot, registry.directory, "pack.xml");
  const packXml = await readFile(packXmlPath, "utf8");
  requireValue(xmlValue(packXml, "ID") === registry.id, `${registryFile} id differs from pack.xml.`);
  requireValue(
    xmlValue(packXml, "DisplayName") === registry.name,
    `${registryFile} name differs from pack.xml.`,
  );
  requireValue(
    semanticVersion.test(xmlValue(packXml, "Version")),
    `${registryFile} pack.xml has an invalid version.`,
  );
  requireValue(
    xmlValue(packXml, "BasePackID") === (registry.basePackId ?? ""),
    `${registryFile} base pack differs from pack.xml.`,
  );
}

for (const directory of directories) {
  requireValue(
    registeredDirectories.has(directory.toLowerCase()),
    `Content pack ${directory} has no packs registry record.`,
  );
}
requireValue(
  registeredDirectories.size === directories.length,
  "A registry record points to a missing content-pack directory.",
);

console.log(`Validated ${registeredIds.size} content pack(s).`);

function xmlValue(xml, element) {
  const match = new RegExp(`<${element}>([^<]*)</${element}>`, "u").exec(xml);
  return match?.[1].trim() ?? "";
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
