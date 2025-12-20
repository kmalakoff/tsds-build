import spawn from 'cross-spawn-cb';
import { safeRm } from 'fs-remove-compat';
import { installSync } from 'install-optional';
import debounce from 'lodash.debounce';
import { bind } from 'node-version-call';
import path from 'path';
import Queue from 'queue-cb';
import resolveBin from 'resolve-bin-sync';
import type { CommandCallback, CommandOptions } from 'tsds-lib';
import url from 'url';

const major = +process.versions.node.split('.')[0];
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const dist = path.join(__dirname, '..', '..');

const installSyncRollup = debounce(installSync, 300, { leading: true, trailing: false });

function run(_args: string[], options: CommandOptions, callback: CommandCallback) {
  const cwd: string = (options.cwd as string) || process.cwd();
  const dest = path.join(cwd, 'dist', 'umd');
  const configRoot = path.join(dist, 'esm', 'rollup');

  try {
    installSyncRollup('rollup', `${process.platform}-${process.arch}`, { cwd });
    const rollup = resolveBin('rollup');

    const queue = new Queue(1);
    queue.defer(safeRm.bind(null, dest));
    queue.defer(spawn.bind(null, rollup, ['--config', path.join(configRoot, 'config.js')], options));
    queue.defer(spawn.bind(null, rollup, ['--config', path.join(configRoot, 'config.min.js')], options));
    queue.await(callback);
  } catch (err) {
    return callback(err);
  }
}

const worker = major >= 20 ? run : bind('>=20', path.join(dist, 'cjs', 'lib', 'umd.js'), { callbacks: true });

export default function umd(args: string[], options: CommandOptions, callback: CommandCallback): void {
  worker(args, options, callback);
}
