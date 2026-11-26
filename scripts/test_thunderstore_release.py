"""Exercise release validation without downloading assets or publishing packages."""

import json
from pathlib import Path
import tempfile
import unittest
import zipfile

from thunderstore_release import release, verify


class ThunderstoreReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.pack = self.root / 'Content/Packs/Example'
        self.config = self.root / 'packs/example-pack'
        self.pack.mkdir(parents=True)
        self.config.mkdir(parents=True)
        (self.pack / 'pack.xml').write_text('<ContentPack><ID>example-pack</ID><Version>1.2.3</Version></ContentPack>')
        (self.root / 'packs/example-pack.json').write_text(json.dumps({'directory': 'Example'}))
        (self.config / 'thunderstore.toml').write_text('''
[package]
namespace = "Fixture"
name = "Example"
[package.dependencies]
[publish]
repository = "https://thunderstore.io"
communities = ["rebellion-2"]
''')
        self.archive = self.root / 'package.zip'

    def create_archive(self, version='1.2.3', include_pack=True):
        with zipfile.ZipFile(self.archive, 'w') as archive:
            archive.writestr('manifest.json', json.dumps({'name': 'Example', 'version_number': version, 'dependencies': []}))
            archive.writestr('README.md', 'Fixture pack')
            archive.writestr('icon.png', (Path(__file__).parent.parent / 'packs/twenty-fifth-anniversary/icon.png').read_bytes())
            if include_pack:
                archive.write(self.pack / 'pack.xml', 'Mods/example-pack/pack.xml')

    def test_metadata_uses_native_pack_version(self):
        metadata, _, _ = release('example-pack', self.root)
        self.assertEqual(metadata['version'], '1.2.3')
        self.assertEqual(metadata['archive'], 'package/Fixture-Example-1.2.3.zip')

    def test_metadata_rejects_unsafe_pack_id(self):
        with self.assertRaises(ValueError):
            release('../example-pack', self.root)

    def test_archive_preserves_native_pack_layout(self):
        self.create_archive()
        self.assertEqual(verify('example-pack', self.archive, self.root), 4)

    def test_archive_rejects_wrong_release_version(self):
        self.create_archive(version='0.0.0')
        with self.assertRaisesRegex(ValueError, 'identity'):
            verify('example-pack', self.archive, self.root)

    def test_archive_rejects_missing_pack_files(self):
        self.create_archive(include_pack=False)
        with self.assertRaisesRegex(ValueError, 'contents'):
            verify('example-pack', self.archive, self.root)
