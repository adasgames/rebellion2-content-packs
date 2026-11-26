"""Read release identity and verify the archive consumed by the mod manager."""

import json
from pathlib import Path
import re
import struct
import sys
import tomllib
import xml.etree.ElementTree as ET
import zipfile


def release(pack_id, root=Path('.')):
    """Return reviewed packaging metadata using the pack's canonical version."""
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', pack_id):
        raise ValueError('Invalid pack ID.')
    registry = json.loads((root / 'packs' / f'{pack_id}.json').read_text())
    directory = registry['directory']
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', directory):
        raise ValueError('Invalid content directory.')
    source = root / 'Content' / 'Packs' / directory
    definition = ET.parse(source / 'pack.xml').getroot()
    if definition.findtext('ID') != pack_id:
        raise ValueError('Pack ID differs from its registry record.')
    version = definition.findtext('Version', '')
    if not re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', version):
        raise ValueError('Invalid pack version.')
    config_path = Path('packs') / pack_id / 'thunderstore.toml'
    config = tomllib.loads((root / config_path).read_text())
    package = config['package']
    namespace, name = package['namespace'], package['name']
    if not all(re.fullmatch(r'[A-Za-z0-9_]+', value) for value in (namespace, name)):
        raise ValueError('Invalid Thunderstore identity.')
    if config['publish']['repository'] != 'https://thunderstore.io' or config['publish']['communities'] != ['rebellion-2']:
        raise ValueError('Unexpected publishing destination.')
    return {
        'version': version, 'namespace': namespace, 'name': name,
        'config': str(config_path), 'archive': f'package/{namespace}-{name}-{version}.zip',
        'directory': directory,
    }, source, config


def verify(pack_id, archive_path, root=Path('.')):
    """Reject incomplete, mismatched, or unsupported archives before publication."""
    metadata, source, config = release(pack_id, root)
    prefix = f'Mods/{pack_id}/'
    expected = {prefix + path.relative_to(source).as_posix() for path in source.rglob('*') if path.is_file()}
    expected.update({'manifest.json', 'README.md', 'icon.png'})
    with zipfile.ZipFile(archive_path) as archive:
        entries = [entry for entry in archive.infolist() if not entry.is_dir()]
        names = [entry.filename for entry in entries]
        if len(set(name.casefold() for name in names)) != len(names) or set(names) != expected:
            raise ValueError('Archive contents differ from the reviewed pack layout.')
        manifest = json.loads(archive.read('manifest.json'))
        if manifest['name'] != metadata['name'] or manifest['version_number'] != metadata['version']:
            raise ValueError('Archive release identity differs from pack.xml.')
        dependencies = [f'{name}-{version}' for name, version in config['package']['dependencies'].items()]
        if sorted(manifest['dependencies']) != sorted(dependencies):
            raise ValueError('Archive dependencies differ from the package configuration.')
        icon = archive.read('icon.png')
        if icon[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', icon[16:24]) != (256, 256):
            raise ValueError('The package icon must be a 256 x 256 PNG.')
        for path in source.rglob('*'):
            if path.is_symlink():
                raise ValueError('Content contains a symbolic link.')
            if path.is_file():
                with path.open('rb') as stream:
                    if stream.read(128).startswith(b'version https://git-lfs.github.com/spec/v1'):
                        raise ValueError('Content still contains Git LFS pointers.')
        if archive.testzip() is not None:
            raise ValueError('Archive integrity verification failed.')
    return len(entries)


def main():
    """Expose metadata and archive verification to local builds and release jobs."""
    if len(sys.argv) == 3 and sys.argv[1] == 'metadata':
        metadata, _, _ = release(sys.argv[2])
        for key, value in metadata.items():
            print(f'{key}={value}')
    elif len(sys.argv) == 4 and sys.argv[1] == 'verify':
        print(f'Verified {verify(sys.argv[2], sys.argv[3])} archive files.')
    else:
        raise SystemExit('Usage: thunderstore-release.py metadata <pack-id> | verify <pack-id> <archive>')


if __name__ == '__main__':
    main()
