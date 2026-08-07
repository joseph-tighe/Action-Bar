const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Returns the writable per-user data directory. Inside an AppImage the
 * application bundle is mounted read-only, so all mutable data (settings,
 * pipelines, downloaded extensions) must live outside the bundle.
 * @returns {string} The absolute userData path.
 */
function getDataDir() {
  return app.getPath('userData');
}

/**
 * Returns the path to the user's settings.json file.
 * @returns {string} The absolute settings path.
 */
function getSettingsPath() {
  return path.join(getDataDir(), 'settings.json');
}

/**
 * Returns the path to the user's pipelines file.
 * @returns {string} The absolute pipelines path.
 */
function getPipelinesPath() {
  return path.join(getDataDir(), 'piplines.json');
}

/**
 * Returns the path to the user's extensions directory.
 * @returns {string} The absolute extensions directory path.
 */
function getExtentionsDir() {
  return path.join(getDataDir(), 'extentions');
}

/**
 * Returns the bundled (read-only) settings path shipped inside the app.
 * @returns {string} The absolute bundled settings path.
 */
function getBundledSettingsPath() {
  return path.join(__dirname, '../../config/settings.json');
}

/**
 * Returns the bundled (read-only) pipelines path shipped inside the app.
 * @returns {string} The absolute bundled pipelines path.
 */
function getBundledPipelinesPath() {
  return path.join(__dirname, '../../src/pipelines/piplines.json');
}

/**
 * Returns the bundled (read-only) extensions directory shipped inside the app.
 * @returns {string} The absolute bundled extensions directory path.
 */
function getBundledExtentionsDir() {
  return path.join(__dirname, '../../src/extentions');
}

/**
 * Ensures a writable settings.json exists in the user data dir, seeding it
 * from the bundled copy on first run. Returns the settings path.
 * @returns {string} The settings path.
 */
function ensureSettings() {
  const target = getSettingsPath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) return target;
  const bundled = getBundledSettingsPath();
  if (fs.existsSync(bundled)) {
    fs.copyFileSync(bundled, target);
  } else {
    fs.writeFileSync(target, '{}');
  }
  return target;
}

/**
 * Ensures a writable pipelines file exists in the user data dir, seeding it
 * from the bundled copy on first run. Returns the pipelines path.
 * @returns {string} The pipelines path.
 */
function ensurePipelines() {
  const target = getPipelinesPath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) return target;
  const bundled = getBundledPipelinesPath();
  if (fs.existsSync(bundled)) {
    fs.copyFileSync(bundled, target);
  } else {
    fs.writeFileSync(target, '[]');
  }
  return target;
}

/**
 * Ensures a writable extensions directory exists in the user data dir,
 * seeding it from the bundled extensions on first run. Returns the
 * extensions directory path.
 * @returns {string} The extensions directory path.
 */
function ensureExtentions() {
  const target = getExtentionsDir();
  if (fs.existsSync(target)) return target;
  fs.mkdirSync(target, { recursive: true });
  const bundled = getBundledExtentionsDir();
  if (fs.existsSync(bundled)) {
    for (const entry of fs.readdirSync(bundled, { withFileTypes: true })) {
      const src = path.join(bundled, entry.name);
      const dst = path.join(target, entry.name);
      if (entry.isDirectory()) {
        fs.cpSync(src, dst, { recursive: true });
      } else {
        fs.copyFileSync(src, dst);
      }
    }
  }
  return target;
}

/**
 * Loads the user's settings, seeding from the bundle if none exist yet.
 * @returns {Object} The parsed settings object.
 */
function loadSettings() {
  ensureSettings();
  return JSON.parse(fs.readFileSync(getSettingsPath(), 'utf8'));
}

module.exports = {
  getDataDir,
  getSettingsPath,
  getPipelinesPath,
  getExtentionsDir,
  getBundledSettingsPath,
  getBundledPipelinesPath,
  getBundledExtentionsDir,
  ensureSettings,
  ensurePipelines,
  ensureExtentions,
  loadSettings
};
