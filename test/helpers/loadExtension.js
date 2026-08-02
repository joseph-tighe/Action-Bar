const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const EXTENTIONS_DIR = path.resolve(__dirname, '../../src/extentions');

function loadExtension(name, globals = {}) {
  const dir = path.join(EXTENTIONS_DIR, name);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const code = fs.readFileSync(path.join(dir, manifest.file), 'utf8');
  const context = vm.createContext({ console, ...globals });
  vm.runInContext(code, context, { filename: `${name}/${manifest.file}` });
  return { manifest, context, code };
}

module.exports = { loadExtension, EXTENTIONS_DIR };
