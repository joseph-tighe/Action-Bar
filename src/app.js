const { app, Tray, BrowserWindow, globalShortcut, ipcMain, Notification, shell, screen, ipcRenderer, Menu } = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const open = require('open');
const { exec } = require('child_process');
const https = require('https');
const AdmZip = require('adm-zip');

let tray = null;
console.log(__dirname);
app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/settings.json')));

function createWindow() {
  const win = new BrowserWindow({
    width: settings['window']['width'],
    height: settings['window']['height'],
    transparent: true,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: true, // Optional: prevents resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false

  })

  win.loadFile(path.join(__dirname, '../../src/index.html'));
  return win;
}
mainWindow = null;
app.whenReady().then(() => {
  console.log(__dirname); 
  tray = new Tray(path.join(__dirname, '../../static/images/icon.png'));
  tray.setToolTip('Launch Hub');
  tray.on('click', () => {
    toggleWindowVisibility();
  })
  mainWindow = createWindow();
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
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered(settings['shortcuts']['open-shortcut']) ? 'Global shortcut is registered' : 'GLobal shortcut failed registration')
})

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister(settings['shortcuts']['open-shortcut'])

  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();

  }
})
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

function getScreen() {
  for (const scr of screen.getAllDisplays()) {
    if (scr.bounds.x <= screen.getCursorScreenPoint().x && scr.bounds.y <= screen.getCursorScreenPoint().y && scr.bounds.x + scr.bounds.width >= screen.getCursorScreenPoint().x && scr.bounds.y + scr.bounds.height >= screen.getCursorScreenPoint().y) {
      return scr;
    }
  }
  return screen.getPrimaryDisplay();
}
ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});
ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url);
});
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
function levenshteinOptimized(a, b) {
  if (a === b) return 0;
  if (a.length > b.length) [a, b] = [b, a];
  const n = a.length, m = b.length;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  for (let i = 0; i <= n; i++) prev[i] = i;
  for (let j = 1; j <= m; j++) {
    const bj = b[j - 1];
    let curr = [j];
    for (let i = 1; i <= n; i++) {
      const cost = a[i - 1] === bj ? 0 : 1;
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function normalize(s) {
  return s.normalize('NFKD').replace(/\p{Diacritic}/gu, '') // remove accents
    .toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, ''); // optional punctuation removal
}

function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinOptimized(a, b);
  return 1 - dist / maxLen; // range 0..1
}

// Find best match (returns {best, score, index})
function findBestMatch(query, candidates) {
  let bestIdx = -1, bestScore = -1;
  for (let i = 0; i < candidates.length; i++) {
    const s = candidates[i];
    const score = similarity(query, s);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { best: candidates[bestIdx], index: bestIdx, score: bestScore };
}

function getApps() {
  // look through start menu
  const desktop = path.join(process.env.USERPROFILE, 'Desktop');
  const appList = [];
  if (fs.existsSync(desktop)) {
    const files = fs.readdirSync(desktop);
    for (const file of files) {
      const filePath = path.join(desktop, file);
      if (fs.statSync(filePath).isDirectory()) {
        const appName = path.basename(filePath);
        const appPath = path.join(filePath, 'Uninstall.exe');
        if (fs.existsSync(appPath)) {
          appList.push({ name: appName, path: appPath });
        }
      } else if (file.endsWith('.lnk')) {
        const appName = path.basename(filePath, '.lnk');
        const appPath = path.join(filePath);
        if (fs.existsSync(appPath)) {
          appList.push({ name: appName, path: appPath });
        }
      }
    }
  }
  return appList;
}
const appList = getApps();

console.log("valid apps found\nsearching for files...");

//keep list of files
const filesForSearch = [];
const filesHash = {};
var initDirs = [
  settings['search-files']['starting-dirs']['desktop'] ? path.join(process.env.USERPROFILE, 'Desktop') : null,
  settings['search-files']['starting-dirs']['documents'] ? path.join(process.env.USERPROFILE, 'Documents') : null,
  settings['search-files']['starting-dirs']['downloads'] ? path.join(process.env.USERPROFILE, 'Downloads') : null,
  settings['search-files']['starting-dirs']['pictures'] ? path.join(process.env.USERPROFILE, 'Pictures') : null,
  settings['search-files']['starting-dirs']['music'] ? path.join(process.env.USERPROFILE, 'Music') : null,
  settings['search-files']['starting-dirs']['videos'] ? path.join(process.env.USERPROFILE, 'Videos') : null,
];
function getFiles() {

  for (const dir of initDirs) {
    if (dir) {
      getFilesFor(dir, 1, settings['search-files']['initial-max-depth']);
    }
  }
}
function checkPermissionsSync(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function getFilesFor(dir, depth, maxDepth) {
  if (depth > maxDepth) return;
  depth++;
  if (fs.existsSync(dir)) {
    let files = [];
    try {
      files = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory() && !file.includes(".") && checkPermissionsSync(filePath) && !settings['search-files']['invalid-directories'].includes(file)) {
        getFilesFor(filePath, depth, maxDepth);
        filesHash[file] = filePath;
        filesForSearch.push(file);
      } else if (file.endsWith("." + settings['search-files']['invalid-file-extensions'].join("."))) {
      } else if (fs.statSync(filePath).isFile()) {
        filesHash[file] = filePath;
        filesForSearch.push(file);
      }
    }
  }
}
getFiles();
function findBestMatchFiles(query, candidates) {
  var cands = candidates;
  query = query.replaceAll("\\", "/");
  if (query.includes("/")) {
    //replace C:\yfdsgu\fius with fius\xyz
    if (query.includes("C:")) {
      for (i = 0; i < query.split("/").length - 1; i++) {
        folder = query.split("/")[i];
        for (initFile of initDirs) {
          if (filesHash[folder] == initFile) {
            query = query.split("/").splice(i).join("/");
            break;
          }
        }
      }
    }
    for (i = 0; i < query.split("/").length - 1; i++) {
      folder = query.split("/")[i];
      var foundFolder = findBestMatch(folder, cands);
      searchThrough = true;
      for (initFile of initDirs) {
        if (filesHash[foundFolder.best] == initFile) {
          searchThrough = false;
          break;
        }
      }
      if (searchThrough) {
        initDirs.push(filesHash[foundFolder.best]);
        getFilesFor(filesHash[foundFolder.best], 1, settings['search-files']['initial-max-depth']);
      }
    }
    var foundFolder = null;
    for (folder of query.split("/")) {
      foundFolder = findBestMatch(folder, cands);
      cands = cands.filter(c => filesHash[c].includes(foundFolder.best));
    }
    return { best: foundFolder.best, index: candidates.indexOf(foundFolder), score: foundFolder.score };
  } else {
    return findBestMatch(query, candidates);
  }
}
function resolvePathForQuery(query, shouldOpen) {
  try {
    if (process.platform !== 'win32') {
      return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
    }

    const appNames = appList.map(app => app.name);
    let closest = findBestMatch(query, appNames);
    if (closest && closest.score > 0.5) {
      const appPath = appList[closest.index].path;
      if (shouldOpen) {
        exec(`start "" "${appPath}"`);
      }
      return { ok: true, file: appPath, action: shouldOpen ? 'Open' : 'Found', type: 'app' };
    }

    closest = findBestMatchFiles(query, filesForSearch);
    if (!closest || closest.best === undefined) {
      return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
    }

    const filePath = filesHash[closest.best];
    if (shouldOpen) {
      exec(`start "" "${filePath}"`);
    }
    return { ok: true, file: filePath, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
  } catch (err) {
    console.error('Failed to open app', err);
    return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
  }
}

ipcMain.handle('search-apps/files', async (event, query) => {
  const result = resolvePathForQuery(query, false);
  event.sender.send('open-file', result);
  return result;
});

ipcMain.handle('search-open-apps/files', async (event, query) => {
  const result = resolvePathForQuery(query, true);
  event.sender.send('open-file', result);
  return result;
});
ipcMain.on('close-window', (event) => {
  toggleWindowVisibility();
});
ipcMain.on('open-settings', (event) => {
  Menu.setApplicationMenu(null);
  settingsWindow = new BrowserWindow({
    width: settings['window']['width'],
    height: settings['window']['height'],
    transparent: false,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: true, // Optional: prevents resizing
    webPreferences: {
      preload: path.join(__dirname, '../../src/settings/preload.js')
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
ipcMain.on('update-settings', (event, settings) => {
  fs.writeFileSync(path.join(__dirname, '../../config/settings.json'), JSON.stringify(settings, null, 4));
});
ipcMain.on('get-extentions', (event) => {
  fileList = [];
  fs.readdirSync(path.join(__dirname, '../../src/extentions')).forEach(file => {
    if (fs.statSync(path.join(__dirname, '../../src/extentions', file)).isDirectory()) {
      fileList.push(file);
    }
  });
  event.reply('get-extentions', fileList);
});

function downloadExtensionZip(git_repo) {
  const URL = `https://github.com/${git_repo}/archive/refs/heads/main.zip`;
  console.log(URL);
  const name = git_repo.split('/').pop();
  const file = fs.createWriteStream(path.join(__dirname, `../../src/extentions/${name}.zip`));
  https.get(URL, function (response) {
    if (response.statusCode === 302 || response.statusCode === 301) {
      https.get(response.headers.location, (response) => {
        response.pipe(file);
        file.on('finish', function () {
          file.close();
          extractZip(path.join(__dirname, `../../src/extentions/${name}.zip`), path.join(__dirname, '../../src/extentions'));
        });
      });
    } else {
      response.pipe(file);
      file.on('finish', function () {
        file.close();
        extractZip(path.join(__dirname, `../../src/extentions/${name}.zip`), path.join(__dirname, '../../src/extentions'));
      });
    }
  });
}
function extractZip(file, dest) {
  const zip = new AdmZip(file);
  zip.extractAllTo(dest, true);
}

ipcMain.on('download-extention', async (event, git_repo) => {
  downloadExtensionZip(git_repo);
}); 