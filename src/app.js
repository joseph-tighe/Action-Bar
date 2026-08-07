const { app, Tray, BrowserWindow, globalShortcut, ipcMain, Notification, shell, screen, Menu, clipboard } = require('electron/main')
const path = require('node:path')
const os = require('node:os')
const fs = require('fs');
const { exec } = require('child_process');
const https = require('https');
const AdmZip = require('adm-zip');
const { resolvePathForQuery } = require('./appFinder');
const updater = require('./updater/updater');
const { loadSettings, getSettingsPath, getExtentionsDir, getPipelinesPath, ensureExtentions, ensurePipelines } = require('./paths');

let tray = null;

// On Wayland, window positioning, transparency and global shortcuts are not
// supported the way they are on X11/Windows. Relaunch under XWayland (which
// every major Wayland desktop ships) so the app behaves like its Windows build.
if (process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland' && !process.argv.includes('--ozone-platform=x11')) {
  app.relaunch({ args: [...process.argv.slice(1), '--ozone-platform=x11'] });
  app.exit(0);
}

// Only allow a single instance so the global shortcut is not contended for.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      toggleWindowVisibility();
    }
  });
}

console.log(__dirname);
app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')

// Settings are stored in the writable user data dir (the bundle is read-only
// when packaged as an AppImage).
const settings = loadSettings();

/**
 * Returns the path to the window/tray/taskbar icon for the current platform.
 * @returns {string} The absolute path to the icon file.
 */
function getWindowIcon() {
  return path.join(__dirname, "../../static/images/icon." + (process.platform === 'linux' ? 'png' : 'ico'));
}

/**
 * Configures the app to launch at login based on settings. Uses the login
 * item mechanism on non-Linux platforms and a `.desktop` autostart entry on
 * Linux.
 */
function setupAutostart() {
  const enabled = settings['window']['start on boot'];
  if (process.platform !== 'linux') {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
      openAsHidden: true
    });
    return;
  }
  const autostartDir = path.join(os.homedir(), '.config', 'autostart');
  const desktopEntry = path.join(autostartDir, 'action-bar.desktop');
  if (enabled) {
    fs.mkdirSync(autostartDir, { recursive: true });
    // Inside an AppImage, app.getPath('exe') points at the ephemeral mount
    // directory which changes every run. APPIMAGE points at the persistent
    // AppImage file itself.
    const execPath = process.env.APPIMAGE || app.getPath('exe');
    const content = [
      '[Desktop Entry]',
      'Type=Application',
      'Name=Action Bar',
      'Comment=Launches apps and quick search',
      `Exec=${JSON.stringify(execPath)}`,
      'Terminal=false',
      'X-GNOME-Autostart-enabled=true',
      ''
    ].join('\n');
    fs.writeFileSync(desktopEntry, content);
  } else if (fs.existsSync(desktopEntry)) {
    fs.unlinkSync(desktopEntry);
  }
}

/**
 * Creates the main application browser window as a frameless, transparent
 * window loading the main UI.
 * @returns {BrowserWindow} The created window.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: settings['window']['width'],
    height: settings['window']['height'],
    icon: getWindowIcon(),
    transparent: true,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: true, // Optional: prevents resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    frame: false

  })
  win.setTitle('Action Bar');
  win.loadFile(path.join(__dirname, '../../src/index.html'));
  return win;
}
mainWindow = null;
app.whenReady().then(() => {
  console.log(__dirname); 
  setupAutostart();
  tray = new Tray(path.join(__dirname, '../../static/images/icon.png'));
  tray.setToolTip('Action Bar');
  tray.on('click', () => {
    toggleWindowVisibility();
  })
  mainWindow = createWindow();
  updater.initialize(settings);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
    mainWindow.hide();
  })
  mainWindow.hide();
  const ret = globalShortcut.register(settings['shortcuts']['open-shortcut'], () => {
    toggleWindowVisibility()
  })
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('focus-search');
  });
  if (!ret) {
    console.log('registration failed')
    try {
      new Notification({ title: 'Action Bar', body: 'The global shortcut could not be registered. Use the tray icon to open Action Bar.' }).show();
    } catch (e) {
      console.log('notification failed', e);
    }
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered(settings['shortcuts']['open-shortcut']) ? 'Global shortcut is registered' : 'GLobal shortcut failed registration')
})

app.on('will-quit', () => {
  updater.stop();
  globalShortcut.unregister(settings['shortcuts']['open-shortcut'])
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();

  }
})
/**
 * Toggles the main window's visibility. When showing, optionally repositions
 * the window to the mouse/cursor screen and centered per summon settings.
 */
function toggleWindowVisibility() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    if (settings['summon']['change-screen']) {
      scr = getScreen();
      if (settings['summon']['summon-on-mouse']) {
        mainWindow.setPosition(screen.getCursorScreenPoint().x - mainWindow.getSize()[0] / 2, screen.getCursorScreenPoint().y - settings['summon']['vertical-offset'], true);
      } else {
        mainWindow.setPosition(Math.round(scr.workArea.x + scr.bounds.width / 2 - mainWindow.getSize()[0] / 2), Math.round(scr.workArea.y + scr.bounds.height / 2 - settings['summon']['vertical-offset']), true);
      }
    }
    mainWindow.show();
  }
}

/**
 * Returns the display that currently contains the mouse cursor, falling back
 * to the primary display if none matches.
 * @returns {Electron.Display} The display under the cursor.
 */
function getScreen() {
  for (const scr of screen.getAllDisplays()) {
    if (scr.bounds.x <= screen.getCursorScreenPoint().x && scr.bounds.y <= screen.getCursorScreenPoint().y && scr.bounds.x + scr.bounds.width >= screen.getCursorScreenPoint().x && scr.bounds.y + scr.bounds.height >= screen.getCursorScreenPoint().y) {
      return scr;
    }
  }
  return screen.getPrimaryDisplay();
}
/**
 * IPC handler: shows a native notification with the given title and body.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {{title: string, body: string}} args The notification content.
 */
ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});
/**
 * IPC handler: opens the given URL in the system's default browser.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} url The URL to open.
 */
ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url);
});
/**
 * IPC handler: runs a shell command and resolves with its trimmed stdout
 * output (resolves with stderr/error message on failure).
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} command The command to run.
 * @returns {Promise<string>} The trimmed command output.
 */
ipcMain.handle('run-bash', async (event, command) => {
  return new Promise((resolve, reject) => {
    const normalizedCommand = String(command || '').trim().replace(/^\$\s*/, '');
    exec(normalizedCommand, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
        return;
      }
      resolve(stdout.trim());
    });
  });
});

/**
 * IPC handler: resolves the path for a given app/file search query with the
 * folder-search option disabled, emits an "open-file" event to the sender.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} query The search query.
 * @returns {Promise<*>} The resolved path result.
 */
ipcMain.handle('search-apps/files', async (event, query) => {
  const result = await resolvePathForQuery(query, false);
  event.sender.send('open-file', result);
  return result;
});

/**
 * IPC handler: resolves the path for an app/file search with the folder-search
 * option enabled, emits an "open-file" event to the sender.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} query The search query.
 * @returns {Promise<*>} The resolved path result.
 */
ipcMain.handle('search-open-apps/files', async (event, query) => {
  const result = await resolvePathForQuery(query, true);
  event.sender.send('open-file', result);
  return result;
});
/**
 * IPC handler: quits the application.
 * @param {Electron.IpcMainEvent} event The IPC event.
 */
ipcMain.on('quit', () => {
  app.quit();
});
/**
 * IPC handler: toggles the main window's visibility.
 * @param {Electron.IpcMainEvent} event The IPC event.
 */
ipcMain.on('close-window', (event) => {
  toggleWindowVisibility();
});
/**
 * IPC handler: opens the settings window as a separate framed window.
 * @param {Electron.IpcMainEvent} event The IPC event.
 */
ipcMain.on('open-settings', (event) => {
  Menu.setApplicationMenu(null);
  settingsWindow = new BrowserWindow({
    width: settings['window']['width'],
    height: settings['window']['height'],
    icon: getWindowIcon(),
    transparent: false,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: true, // Optional: prevents resizing
    webPreferences: {
      preload: path.join(__dirname, '../../src/settings/preload.js'),
      sandbox: false
    },
    frame: true
  })
  settingsWindow.loadFile(path.join(__dirname, '../../src/settings/index.html'));
  settingsWindow.on('blur', () => {
    settingsWindow.hide();
  });
  settingsWindow.on('focus', () => {
    settingsWindow.webContents.send('focus-search');
  });
});
/**
 * IPC handler: writes the updated settings to the settings file.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {Object} settings The new settings object.
 */
ipcMain.handle('update-settings', (event, newSettings) => {
  try {
    fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
    fs.writeFileSync(getSettingsPath(), JSON.stringify(newSettings, null, 4));
    return { ok: true };
  } catch (err) {
    console.error('Failed to save settings:', err);
    return { ok: false, error: err.message };
  }
});
/**
 * IPC handler: quits and installs a pending app update.
 * @param {Electron.IpcMainEvent} event The IPC event.
 */
ipcMain.on('update-app', () => {
  updater.quitAndInstall();
});
/**
 * IPC handler: returns the last known updater state.
 * @returns {*} The updater state.
 */
ipcMain.handle('get-update-state', () => {
  return updater.getLastState();
});
/**
 * IPC handler: persists per-extension settings into each extension's manifest.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {Object} extensionSettings A map of extension name to settings.
 * @param {Object} dirMap A map of extension name to directory.
 */
ipcMain.handle('update-extention-settings', (event, extensionSettings, dirMap) => {
  try {
    for (const [name, extSettings] of Object.entries(extensionSettings)) {
      const dir = dirMap[name];
      if (!dir) continue;
      const manifestPath = path.join(getExtentionsDir(), dir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.settings = extSettings;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    }
    return { ok: true };
  } catch (err) {
    console.error('Failed to save extension settings:', err);
    return { ok: false, error: err.message };
  }
});
/**
 * IPC handler: lists the installed extension directories (from the writable
 * extensions dir) and replies to the sender.
 * @param {Electron.IpcMainEvent} event The IPC event.
 */
ipcMain.on('get-extentions', (event) => {
  try {
    ensureExtentions();
    const fileList = [];
    fs.readdirSync(getExtentionsDir()).forEach(file => {
      if (fs.statSync(path.join(getExtentionsDir(), file)).isDirectory()) {
        fileList.push(file);
      }
    });
    event.reply('get-extentions', fileList);
  } catch (err) {
    console.error('get-extentions failed:', err);
    event.reply('get-extentions', []);
  }
});
/**
 * IPC handler: reads an extension's manifest.json from the writable extensions
 * dir.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} name The extension directory name.
 * @returns {Promise<Object|null>} The parsed manifest or null.
 */
ipcMain.handle('get-extention-manifest', (event, name) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(getExtentionsDir(), name, 'manifest.json'), 'utf8'));
  } catch (err) {
    console.error('get-extention-manifest failed:', err);
    return null;
  }
});
/**
 * IPC handler: reads an extension's source file from the writable extensions
 * dir.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} name The extension directory name.
 * @param {string} fileName The file to read.
 * @returns {Promise<string>} The file contents.
 */
ipcMain.handle('get-extention-code', (event, name, fileName) => {
  try {
    return fs.readFileSync(path.join(getExtentionsDir(), name, fileName), 'utf8');
  } catch (err) {
    console.error('get-extention-code failed:', err);
    return '';
  }
});
/**
 * IPC handler: returns the current settings object.
 * @returns {Object} The parsed settings.
 */
ipcMain.handle('get-settings', () => {
  return loadSettings();
});
/**
 * IPC handler: returns the pipelines configuration.
 * @returns {Object[]} The parsed pipelines.
 */
ipcMain.handle('get-pipelines', () => {
  ensurePipelines();
  return JSON.parse(fs.readFileSync(getPipelinesPath(), 'utf8'));
});
/**
 * IPC handler: reads text from the system clipboard from the main process so
 * it works even when the window is hidden/unfocused (Wayland requires focus
 * for navigator.clipboard).
 * @returns {Promise<string>} The clipboard text.
 */
ipcMain.handle('clipboard-read-text', () => {
  try {
    return clipboard.readText();
  } catch (err) {
    console.error('clipboard read failed:', err);
    return '';
  }
});
/**
 * IPC handler: writes text to the system clipboard from the main process.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} text The text to write.
 */
ipcMain.on('clipboard-write-text', (event, text) => {
  try {
    clipboard.writeText(String(text ?? ''));
  } catch (err) {
    console.error('clipboard write failed:', err);
  }
});

/**
 * Downloads and extracts an extension from a GitHub repo at the given commit.
 * @param {string} git_repo The GitHub repository in "owner/repo" form.
 * @param {string} commitHash The commit hash to download the archive from.
 */
function downloadExtensionZip(git_repo, commitHash) {
  const URL = `https://github.com/${git_repo}/archive/${commitHash}.zip`;
  console.log(URL);
  const name = git_repo.split('/').pop();
  ensureExtentions();
  const file = fs.createWriteStream(path.join(getExtentionsDir(), `${name}.zip`));
  https.get(URL, function (response) {
    if (response.statusCode === 302 || response.statusCode === 301) {
      https.get(response.headers.location, (response) => {
        response.pipe(file);
        file.on('finish', function () {
          file.close();
          extractZip(path.join(getExtentionsDir(), `${name}.zip`), getExtentionsDir());
        });
      });
    } else {
      response.pipe(file);
      file.on('finish', function () {
        file.close();
        extractZip(path.join(getExtentionsDir(), `${name}.zip`), getExtentionsDir());
      });
    }
  });
}
/**
 * Extracts a ZIP archive to the given destination directory.
 * @param {string} file The path to the ZIP file.
 * @param {string} dest The destination directory to extract into.
 */
function extractZip(file, dest) {
  const zip = new AdmZip(file);
  zip.extractAllTo(dest, true);
}

/**
 * IPC handler: triggers download and extraction of the given extension repo.
 * @param {Electron.IpcMainEvent} event The IPC event.
 * @param {string} git_repo The GitHub repository in "owner/repo" form.
 * @param {string} commitHash The commit hash to download.
 */
ipcMain.on('download-extention', async (event, git_repo, commitHash) => {
  downloadExtensionZip(git_repo, commitHash);
}); 
app.whenReady().then(() => {
  setTimeout(() => {
    console.log("app ready");
    toggleWindowVisibility();
  }, 500);
});
