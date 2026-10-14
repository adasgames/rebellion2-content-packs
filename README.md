# Rebellion 2 Content Packs

Official optional content packs for Rebellion 2 live here independently from the game, launcher,
and primary content repositories.

## Repository layout

- `Content/Packs/<directory>` contains each installable content pack.
- `Source/<directory>` retains authoring and reference assets that are not installed with a pack.
- `packs/<id>.json` contains the launcher catalogue metadata for that pack.
- `hosting/` contains the public, read-only R2 gateway used by the launcher.
- `scripts/` validates and packages immutable, content-addressed releases.

## Large files

Binary assets use Git LFS backed by the `rebellion2-content-packs` Cloudflare R2 bucket. Install
[Git LFS](https://git-lfs.com/) before cloning. The committed `.lfsconfig` selects the project-owned
LFS gateway; authorized contributors provide R2 credentials through their Git credential manager.

## Publishing

The `Publish content pack` workflow reads a pack's registry record and `pack.xml`, downloads that
pack's LFS objects, builds its manifest and content-addressed blobs, uploads them to R2, and updates
`catalogue.json` only after the immutable files are available.

Launcher downloads are public at `https://rebellion2-content-packs.pages.dev/`. Repository and
release storage share one R2 bucket but use separate key spaces.
