const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const SRC_DIR = path.resolve(__dirname, '../src');
const REPO_ROOT = path.resolve(__dirname, '..');

function buildBundleLayout() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-bundle-'));
  fs.mkdirSync(path.join(root, 'app.asar', 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src', 'extentions'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src', 'pipelines'), { recursive: true });
  fs.cpSync(path.join(REPO_ROOT, 'config'), path.join(root, 'config'), { recursive: true });
  fs.cpSync(path.join(REPO_ROOT, 'src', 'extentions'), path.join(root, 'src', 'extentions'), { recursive: true });
  fs.cpSync(path.join(REPO_ROOT, 'src', 'pipelines'), path.join(root, 'src', 'pipelines'), { recursive: true });
  return root;
}

function loadPathsModule(userDataDir, bundleRoot) {
  const code = fs.readFileSync(path.join(SRC_DIR, 'paths.js'), 'utf8');
  const exportsObj = {};
  const sandbox = {
    console,
    Buffer,
    __dirname: path.join(bundleRoot, 'app.asar', 'src'),
    module: { exports: exportsObj },
    exports: exportsObj,
    require: (name) => {
      if (name === 'electron') {
        return { app: { getPath: () => userDataDir } };
      }
      if (name === 'node:fs') return fs;
      if (name === 'fs') return fs;
      if (name === 'node:path') return path;
      return require(name);
    }
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(code, context, { filename: 'paths.js' });
  return context;
}

test('getDataDir returns the userData path', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-paths-'));
  const bundle = buildBundleLayout();
  try {
    const ctx = loadPathsModule(userData, bundle);
    assert.equal(ctx.getDataDir(), userData);
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(bundle, { recursive: true, force: true });
  }
});

test('ensureSettings seeds settings from the bundle on first run', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-paths-'));
  const bundle = buildBundleLayout();
  try {
    const ctx = loadPathsModule(userData, bundle);
    const settingsPath = ctx.ensureSettings();
    assert.ok(fs.existsSync(settingsPath));
    const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(parsed.window, 'bundled settings should contain the window group');
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(bundle, { recursive: true, force: true });
  }
});

test('ensureSettings does not overwrite an existing user settings file', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-paths-'));
  const bundle = buildBundleLayout();
  try {
    fs.mkdirSync(userData, { recursive: true });
    fs.writeFileSync(path.join(userData, 'settings.json'), JSON.stringify({ custom: true }));
    const ctx = loadPathsModule(userData, bundle);
    const settingsPath = ctx.ensureSettings();
    const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.deepEqual(parsed, { custom: true });
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(bundle, { recursive: true, force: true });
  }
});

test('ensureExtentions seeds extensions from the bundle on first run', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-paths-'));
  const bundle = buildBundleLayout();
  try {
    const ctx = loadPathsModule(userData, bundle);
    const extDir = ctx.ensureExtentions();
    assert.ok(fs.existsSync(path.join(extDir, 'open', 'manifest.json')), 'bundled open extension should be seeded');
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(bundle, { recursive: true, force: true });
  }
});

test('ensurePipelines seeds pipelines from the bundle on first run', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-paths-'));
  const bundle = buildBundleLayout();
  try {
    const ctx = loadPathsModule(userData, bundle);
    const pipesPath = ctx.ensurePipelines();
    assert.ok(fs.existsSync(pipesPath));
    const parsed = JSON.parse(fs.readFileSync(pipesPath, 'utf8'));
    assert.ok(Array.isArray(parsed));
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(bundle, { recursive: true, force: true });
  }
});

test('loadSettings returns the parsed user settings', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-paths-'));
  const bundle = buildBundleLayout();
  try {
    const ctx = loadPathsModule(userData, bundle);
    const settings = ctx.loadSettings();
    assert.ok(typeof settings === 'object');
    assert.ok(settings['search-files'], 'settings should be the parsed bundle');
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(bundle, { recursive: true, force: true });
  }
});
