const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC_DIR = path.resolve(__dirname, '../../src');
const CONFIG_PATH = path.resolve(__dirname, '../../config/settings.json');

function loadAppFinder(overrides = {}) {
  const code = fs.readFileSync(path.join(SRC_DIR, 'appFinder.js'), 'utf8');

  const settings = overrides.settings ?? JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (overrides.disableFileSearch) {
    for (const key of Object.keys(settings['search-files']['starting-dirs'])) {
      settings['search-files']['starting-dirs'][key] = false;
    }
  }

  const realFs = require('node:fs');
  const patchedFs = {
    ...realFs,
    readFileSync: (p, ...args) => {
      const resolved = path.resolve(String(p));
      if (resolved.endsWith(path.join('config', 'settings.json'))) {
        return JSON.stringify(settings);
      }
      return realFs.readFileSync(p, ...args);
    }
  };

  const sandbox = {
    console,
    Buffer,
    process: {
      env: { USERPROFILE: process.env.USERPROFILE, HOME: process.env.HOME },
      platform: 'win32'
    },
    __dirname: SRC_DIR,
    module: { exports: {} },
    require: (name) => {
      if (name === 'electron/main') {
        return {
          app: {
            getFileIcon: async () => ({ toDataURL: () => 'data:image/png;base64,AA==' })
          }
        };
      }
      if (name === 'node:path') return require('node:path');
      if (name === 'node:os') return require('node:os');
      if (name === 'fs') return patchedFs;
      if (name === 'child_process') {
        return {
          exec: (_cmd, _opts, cb) => { if (typeof _opts === 'function') { _opts(null, '[]', ''); } else if (cb) { cb(null, '[]', ''); } },
          execSync: () => '',
          spawn: () => ({ unref: () => {} })
        };
      }
      return require(name);
    }
  };
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  vm.runInContext(code, context, { filename: 'appFinder.js' });
  return context;
}

module.exports = { loadAppFinder, SRC_DIR, CONFIG_PATH };
