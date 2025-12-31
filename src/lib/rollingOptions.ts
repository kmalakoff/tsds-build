import fs from 'fs';
import camelcase from 'lodash.camelcase';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';

import { loadConfig, type Package } from 'tsds-lib';

export const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as Package;
const config = loadConfig();
if (!config?.source) throw new Error('Missing "source" in package.json or .tsdsrc.json. Add "source": "src/index.ts" (or .tsx) to your config.');
export const source = config.source;
const entry = (config?.entry ?? source) as string;
export const input = path.join.apply(null, [process.cwd(), ...entry.split('/')]) as string;
export const name = camelcase(pkg.name) as string;
export const globals = (config?.globals || {}) as Record<string, string>;

const DEPS = ['dependencies', 'optionalDependencies', 'peerDependencies'];
DEPS.forEach((x) => {
  const deps = pkg[x] || {};
  for (const name in deps) {
    if (globals[name] === undefined) console.log(`umd dependency ${name}is missing. Add a "tsds": { "globals": { "${name}": "SomeName" } } to your package.json`);
  }
});

export const tsconfig = loadConfigSync(process.cwd());
tsconfig.config.compilerOptions = { ...tsconfig.config.compilerOptions, target: 'es5' };
