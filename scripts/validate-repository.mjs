import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isSemanticVersion, isVersionRequirement } from "./semver.mjs";

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
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
    registry.depends && typeof registry.depends === "object" && !Array.isArray(registry.depends),
    `${registryFile} has no dependency map.`,
  );
  requireValue("rebellion2" in registry.depends, `${registryFile} does not depend on rebellion2.`);
  for (const [id, requirement] of Object.entries(registry.depends)) {
    requireValue(slug.test(id) && id !== registry.id, `${registryFile} has invalid dependency ${id}.`);
    requireValue(
      isVersionRequirement(requirement),
      `${registryFile} has an invalid requirement for ${id}.`,
    );
  }
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
    isSemanticVersion(xmlValue(packXml, "Version")),
    `${registryFile} pack.xml has an invalid version.`,
  );
  const basePackId = xmlValue(packXml, "BasePackID");
  const contentDependencies = Object.keys(registry.depends).filter((id) => id !== "rebellion2");
  requireValue(
    contentDependencies.length === (basePackId ? 1 : 0) &&
      (!basePackId || contentDependencies[0] === basePackId),
    `${registryFile} dependencies differ from pack.xml inheritance.`,
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
