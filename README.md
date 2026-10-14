# Rebellion 2 Content Packs

## What this repository is

This repository is the home for additional Rebellion 2 mods and content packs. Packs published
here can add or replace game data, scenarios, factions, maps, artwork, audio, and other content
without being bundled with the main game.

Published packs are made available through the Rebellion 2 launcher, which handles installation
and updates for players.

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
3. A matching catalogue record at `packs/<id>.json` containing the ID, display name, description,
   directory, and version requirements.
4. Optional authoring files under `Source/<Directory>` when they would help maintain the pack.
5. Screenshots, audio samples, or testing notes that help reviewers evaluate the submission.

If the pack builds on another content pack, declare that pack in both `BasePackID` in `pack.xml` and
the catalogue record's `depends` section. Only include files your pack owns or overrides; do not
duplicate inherited content.

Before opening the pull request, install Node.js, Git LFS, and `xmllint`, then run:

```bash
./build.sh all
```

The pull request must pass all repository checks and content review before it can be published. A
maintainer will publish an approved pack through the repository's GitHub Actions workflow. Published
versions are permanent, so any later file change requires a new version number in `pack.xml`.
