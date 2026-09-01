/**
 * Fails on a static import of a core module that core only registers for async
 * chunks.
 *
 * Those modules have typings, so TypeScript is happy, and they resolve to
 * `undefined` at runtime, so the extension dies at boot with something like
 * "undefined is not an object (evaluating 'G().prototype')". The build says
 * nothing either way. This is the check that says something.
 *
 * The fix is to address the module by path, which defers the patch until the
 * chunk lands:
 *
 *   extend('flarum/forum/components/SettingsPage', 'settingsItems', ...)
 *
 * A `import type` is fine and ignored here, because it is erased at compile
 * time. So is a dynamic `import()`, which is the whole point of a chunk.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = new URL('../src', import.meta.url).pathname;
const CORE_DIST = new URL('../../vendor/flarum/core/js/dist', import.meta.url).pathname;

if (!existsSync(CORE_DIST)) {
  console.log('check-flarum-imports: core dist not found, skipping. Run composer install first.');
  process.exit(0);
}

const bundles = ['forum.js', 'admin.js']
  .map((name) => join(CORE_DIST, name))
  .filter(existsSync)
  .map((path) => readFileSync(path, 'utf8'));

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);

    return statSync(path).isDirectory() ? walk(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}

// `import X from 'flarum/...'` and `import { X } from 'flarum/...'`, but not
// `import type ...`, and not `import('flarum/...')`.
const STATIC_IMPORT = /^\s*import\s+(?!type\s)([^;]*?)\s+from\s+'(flarum\/[^']+)'/gm;

const problems = [];

for (const file of walk(SRC)) {
  const source = readFileSync(file, 'utf8');

  for (const [, clause, module] of source.matchAll(STATIC_IMPORT)) {
    // `import { type Foo }` is erased too.
    if (/^\{\s*type\s/.test(clause.trim())) continue;

    const path = module.slice('flarum/'.length);
    const eager = bundles.some((bundle) => bundle.includes(`flarum.reg.add("core","${path}"`));

    if (!eager) {
      problems.push(`${relative(SRC, file)}: ${module}`);
    }
  }
}

if (problems.length) {
  console.error('These modules are registered by core for async chunks only, so a static import of them is');
  console.error('undefined at runtime. Use `import type` plus the string form of extend(), or import() them.\n');

  for (const problem of problems) console.error(`  ${problem}`);

  process.exit(1);
}

console.log('check-flarum-imports: every statically imported core module is eagerly registered.');
