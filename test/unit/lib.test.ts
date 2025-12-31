// remove NODE_OPTIONS to not interfere with tests
delete process.env.NODE_OPTIONS;

import assert from 'assert';
import fs from 'fs';
import { linkModule, unlinkModule } from 'module-link-unlink';
import os from 'os';
import osShim from 'os-shim';
import path from 'path';
import Queue from 'queue-cb';
import * as resolve from 'resolve';
import shortHash from 'short-hash';
import { installGitRepo } from 'tsds-lib-test';
import url from 'url';

import { arrayIncludes, stringEndsWith } from '../lib/compat.ts';

const tmpdir = os.tmpdir || osShim.tmpdir;
const resolveSync = (resolve.default ?? resolve).sync;

import build from 'tsds-build';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));

const GITS = [
  'https://github.com/kmalakoff/fetch-http-message.git',
  'https://github.com/kmalakoff/parser-multipart.git',
  'https://github.com/kmalakoff/react-dom-event.git',
  'https://github.com/kmalakoff/react-ref-boundary.git', // .tsx source with UMD target
];

function addTests(repo) {
  const repoName = path.basename(repo, path.extname(repo));
  describe(repoName, () => {
    const dest = path.join(tmpdir(), 'tsds-build', shortHash(process.cwd()), repoName);
    const modulePath = fs.realpathSync(path.join(__dirname, '..', '..'));
    const modulePackage = JSON.parse(fs.readFileSync(path.join(modulePath, 'package.json'), 'utf8'));
    const nodeModules = path.join(dest, 'node_modules');
    const deps = { ...(modulePackage.dependencies || {}), ...(modulePackage.peerDependencies || {}) };

    before((cb) => {
      installGitRepo(repo, dest, (err?: Error): void => {
        if (err) {
          cb(err);
          return;
        }

        const queue = new Queue();
        queue.defer(linkModule.bind(null, modulePath, nodeModules));
        for (const dep in deps) queue.defer(linkModule.bind(null, path.dirname(resolveSync(`${dep}/package.json`)), nodeModules));
        queue.await(cb);
      });
    });
    after((cb) => {
      const queue = new Queue();
      queue.defer(unlinkModule.bind(null, modulePath, nodeModules));
      for (const dep in deps) queue.defer(unlinkModule.bind(null, path.dirname(resolveSync(`${dep}/package.json`)), nodeModules));
      queue.await(cb);
    });

    describe('happy path', () => {
      it('build', (done) => {
        build([], { cwd: dest }, (err?: Error): void => {
          if (err) {
            done(err);
            return;
          }
          // Verify dist folder was created
          assert.ok(fs.existsSync(path.join(dest, 'dist')), 'dist folder should exist');

          // Verify UMD output exists when configured
          const pkg = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'));
          const targets = pkg.tsds?.targets || [];
          if (arrayIncludes(targets, 'umd')) {
            assert.ok(fs.existsSync(path.join(dest, 'dist', 'umd')), 'dist/umd folder should exist for UMD target');
            const umdFiles = fs.readdirSync(path.join(dest, 'dist', 'umd'));
            assert.ok(
              umdFiles.some((f) => stringEndsWith(f, '.cjs')),
              'UMD .cjs file should exist'
            );
          }

          done();
        });
      });
    });
  });
}
describe('lib', () => {
  for (let i = 0; i < GITS.length; i++) {
    addTests(GITS[i]);
  }
});

describe('umd entry override', () => {
  const dest = path.join(tmpdir(), 'tsds-build', shortHash(process.cwd()), 'umd-entry-override');
  const modulePath = fs.realpathSync(path.join(__dirname, '..', '..'));
  const modulePackage = JSON.parse(fs.readFileSync(path.join(modulePath, 'package.json'), 'utf8'));
  const nodeModules = path.join(dest, 'node_modules');
  const deps = { ...(modulePackage.dependencies || {}), ...(modulePackage.peerDependencies || {}) };
  const pkgName = 'tsds-build-umd-entry-test';

  before((cb) => {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(path.join(dest, 'src'), { recursive: true });

    const pkg = {
      name: pkgName,
      version: '0.0.0',
      tsds: {
        source: 'src/index.ts',
        entry: 'src/umd.ts',
        targets: ['umd'],
      },
    };
    fs.writeFileSync(path.join(dest, 'package.json'), JSON.stringify(pkg, null, 2));
    fs.writeFileSync(
      path.join(dest, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            module: 'esnext',
            moduleResolution: 'node',
            target: 'es2017',
            esModuleInterop: true,
          },
        },
        null,
        2
      )
    );
    fs.writeFileSync(path.join(dest, 'src', 'index.ts'), "export const fromIndex = 'INDEX_ONLY';\n");
    fs.writeFileSync(path.join(dest, 'src', 'umd.ts'), "export const fromUmd = 'UMD_ONLY';\nexport default function umdDefault() { return fromUmd; }\n");

    const queue = new Queue();
    queue.defer(linkModule.bind(null, modulePath, nodeModules));
    for (const dep in deps) queue.defer(linkModule.bind(null, path.dirname(resolveSync(`${dep}/package.json`)), nodeModules));
    queue.await(cb);
  });

  after((cb) => {
    const queue = new Queue();
    queue.defer(unlinkModule.bind(null, modulePath, nodeModules));
    for (const dep in deps) queue.defer(unlinkModule.bind(null, path.dirname(resolveSync(`${dep}/package.json`)), nodeModules));
    queue.await(cb);
  });

  it('uses entry for UMD bundle input', (done) => {
    build([], { cwd: dest }, (err?: Error): void => {
      if (err) {
        done(err);
        return;
      }

      const umdFile = path.join(dest, 'dist', 'umd', `${pkgName}.cjs`);
      assert.ok(fs.existsSync(umdFile), 'UMD output should exist');
      const output = fs.readFileSync(umdFile, 'utf8');
      assert.ok(output.includes('UMD_ONLY'), 'UMD bundle should include entry override content');
      assert.ok(!output.includes('INDEX_ONLY'), 'UMD bundle should not include default source content');
      done();
    });
  });
});
