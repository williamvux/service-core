import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = join(import.meta.dirname, '..');
const tsc = join(root, 'node_modules/.bin/tsc');

rmSync(join(root, 'dist'), { recursive: true, force: true });

// Splitting keeps one shared copy of any module both entries import.
await build({
    entryPoints: {
        index: join(root, 'src/index.ts'),
        testing: join(root, 'src/testing/index.ts'),
    },
    outdir: join(root, 'dist'),
    bundle: true,
    splitting: true,
    packages: 'external',
    platform: 'node',
    format: 'esm',
    target: 'node22',
    sourcemap: true,
    logLevel: 'info',
});

execFileSync(tsc, ['-p', join(root, 'tsconfig.build.json')], {
    stdio: 'inherit',
});

// tsc leaves `.ts` in re-exports of declaration files; consumers resolve `.js`.
const typesDir = join(root, 'dist/types');
for (const entry of readdirSync(typesDir, {
    recursive: true,
    withFileTypes: true,
})) {
    if (!entry.isFile() || !entry.name.endsWith('.d.ts')) continue;
    const file = join(entry.parentPath, entry.name);
    const source = readFileSync(file, 'utf8');
    writeFileSync(
        file,
        source.replace(/(from ['"]\.[^'"]*)\.ts(['"])/g, '$1.js$2'),
    );
}
