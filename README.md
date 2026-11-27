# Rebellion 2 Content Packs

## What this repository is

This repository is the home for additional Rebellion 2 mods and content packs. Packs published
here can add or replace game data, scenarios, factions, maps, artwork, audio, and other content
without being bundled with the main game.

Published packs are available on [Thunderstore](https://thunderstore.io/c/rebellion-2/).
Players install and update them through the content pack editor’s mod manager.

## Submit your content for review

Before submitting a large pack, contact a maintainer with:

- The pack's name and a short description.
- A summary of what it adds or changes.
- The source of its artwork, audio, and other assets.
- Confirmation that those assets may be redistributed.
- The versions of Rebellion 2 and any other content packs it requires.

The repository uses a project-owned Git LFS service for large binary files. A maintainer must arrange
upload access before you can push those assets.

When the content is ready, open a pull request containing:

1. The installable pack under `Content/Packs/<Directory>`.
2. A valid `pack.xml` inside that directory with a permanent lowercase, hyphenated ID, a semantic
   version such as `1.0.0`, a display name, and the paths used by the pack.
3. A matching pack registry record at `packs/<id>.json` containing the ID, display name, description,
   directory, and version requirements.
4. Thunderstore metadata, a 256 × 256 icon, and a package README under `packs/<id>/`.
5. Optional authoring files under `Source/<Directory>` when they would help maintain the pack.
6. Screenshots, audio samples, or testing notes that help reviewers evaluate the submission.

If the pack builds on another content pack, declare that pack in both `BasePackID` in `pack.xml` and
the catalogue record's `depends` section. Only include files your pack owns or overrides; do not
duplicate inherited content.

Before opening the pull request, install Node.js, Python 3.11 or newer, Git LFS, and `xmllint`, then run:

```bash
./build.sh all
```

The pull request must pass all repository checks and content review before it can be published. A
maintainer will publish an approved pack through the repository's GitHub Actions workflow. Published
versions are permanent, so any later file change requires a new version number in `pack.xml`.

## Anniversary setting inheritance

The anniversary pack requires Rebellion 2 0.1.7 or newer. Its data and theme documents marked
`Inherit="true"` contain the settings it overrides. Omitted settings follow the base pack, and the
unchanged officer traits are inherited through the manifest's existing path. Gameplay events
are inherited unchanged from Classic Galactic Civil War; the anniversary pack does not maintain
its own event file.

These documents remain complete replacements:

- `pack.xml` declares the pack's identity and content paths; its fields are read directly.
- `Shared/Data/planet-sectors.xml` preserves the pack's planet order.
- `Shared/Data/message-definitions.xml` currently replaces the base report list.

Nested collections without stable record identities also replace as a whole. Keep their complete
authored contents when overriding them, including notification lists and ship-name pools.

## Publishing to Thunderstore

The **Publish content pack** workflow builds a ZIP with the official Thunderstore CLI, pinned in
`.config/dotnet-tools.json`. Its version comes from `pack.xml`; publishing metadata, artwork,
and package README live in `packs/<id>/`. Native pack IDs remain unchanged.

Run the workflow with `publish` disabled to produce and validate an artifact. Enable `publish`
only when ready to release. Configure the repository secret `THUNDERSTORE_TOKEN` with a
service-account token authorized to publish under the namespace in `thunderstore.toml`.
The existing Anniversary package is `AdasGames-25th_Anniversary`. Every update must increase
`pack.xml`'s version; already published versions are rejected before upload.

The workflow still reads Git LFS assets from the repository's private storage. Releases are
uploaded to Thunderstore; it no longer updates the patcher's R2 catalogue or release blobs.
