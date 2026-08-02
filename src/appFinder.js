const path = require('node:path');
const fs = require('fs');
const os = require('node:os');
const { exec, execSync, spawn } = require('child_process');
const { app } = require('electron/main');

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/settings.json')));

var packageCache = null;
var iconCache = new Map();

function getHomeDir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir() || '';
}

function getUserDir(name) {
  if (process.platform === 'win32') return null;
  try {
    const out = execSync(`xdg-user-dir ${name}`, { encoding: 'utf8', timeout: 2000 }).trim();
    if (out && fs.existsSync(out)) return out;
  } catch {}
  return null;
}

function buildSearchDirs() {
  const home = getHomeDir();
  const labels = { desktop: 'Desktop', documents: 'Documents', downloads: 'Downloads', pictures: 'Pictures', music: 'Music', videos: 'Videos' };
  const dirs = [];
  for (const [key, label] of Object.entries(labels)) {
    if (!settings['search-files']['starting-dirs'][key]) continue;
    let dir = null;
    if (process.platform === 'win32') {
      dir = path.join(home, label);
    } else {
      dir = getUserDir(key) || path.join(home, label);
    }
    if (dir) dirs.push(dir);
  }
  return dirs;
}

function getLinuxDesktopDirs() {
  const home = getHomeDir();
  const dirs = [];
  const dataHome = process.env.XDG_DATA_HOME || path.join(home, '.local', 'share');
  dirs.push(path.join(dataHome, 'applications'));
  const dataDirs = (process.env.XDG_DATA_DIRS || '/usr/local/share:/usr/share').split(':');
  for (const d of dataDirs) {
    if (d) dirs.push(path.join(d, 'applications'));
  }
  return [...new Set(dirs.map(d => path.resolve(d)))];
}

function walkDesktopFiles(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDesktopFiles(full, out);
    else if (e.isFile() && e.name.endsWith('.desktop')) out.push(full);
  }
}

function parseDesktopFile(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); } catch { return null; }
  const entry = {};
  let inDesktopEntry = false;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
      inDesktopEntry = line.slice(1, -1) === 'Desktop Entry';
      continue;
    }
    if (!inDesktopEntry || !line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (key.includes('[')) continue;
    entry[key] = line.slice(eq + 1).trim();
  }
  if (entry.Type !== 'Application') return null;
  if (entry.Hidden === 'true' || entry.NoDisplay === 'true') return null;
  if (!entry.Name || !entry.Exec) return null;
  return { name: entry.Name, exec: entry.Exec, icon: entry.Icon || '' };
}

function getLinuxApps() {
  const seen = new Set();
  for (const dir of getLinuxDesktopDirs()) {
    if (!fs.existsSync(dir)) continue;
    const files = [];
    walkDesktopFiles(dir, files);
    for (const f of files) {
      const entry = parseDesktopFile(f);
      if (!entry) continue;
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);
      appList.push({ name: entry.name, appId: '', type: 'linux', targetPath: entry.exec, iconPath: entry.icon, desktopPath: f });
    }
  }
}

function resolveDesktopIcon(icon) {
  if (!icon) return null;
  const home = getHomeDir();
  if (icon.startsWith('/')) {
    return fs.existsSync(icon) ? icon : null;
  }
  const baseDirs = [
    path.join(home, '.local', 'share', 'icons'),
    path.join(home, '.icons'),
    '/usr/local/share/icons',
    '/usr/share/icons',
    '/usr/share/pixmaps'
  ];
  const sizes = ['256x256', '128x128', '64x64', '48x48', '32x32', '24x24', 'scalable'];
  const rels = [];
  for (const size of sizes) {
    rels.push(path.join('hicolor', size, 'apps'));
    rels.push(path.join('Adwaita', size, 'apps'));
    rels.push(path.join('breeze', size, 'apps'));
    rels.push(path.join('Papirus', size, 'apps'));
  }
  const exts = ['png', 'svg', 'xpm'];
  for (const dir of baseDirs) {
    for (const rel of rels) {
      for (const ext of exts) {
        const full = path.join(dir, rel, `${icon}.${ext}`);
        if (fs.existsSync(full)) return full;
      }
    }
    for (const ext of exts) {
      const full = path.join(dir, `${icon}.${ext}`);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
}

function launchLinuxApp(appObj) {
  const cmd = (appObj.targetPath || '').replace(/%(u|U|f|F|i|c|k)/g, '').trim();
  let child;
  if (cmd) {
    child = exec(cmd, { detached: true, stdio: 'ignore' });
  } else if (appObj.desktopPath) {
    child = exec(`xdg-open "${appObj.desktopPath}"`, { detached: true, stdio: 'ignore' });
  }
  if (child) child.unref();
}

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
  return s.normalize('NFKD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, '');
}

function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinOptimized(a, b);
  return 1 - dist / maxLen;
}

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

function loadPackages() {
    return new Promise((resolve, reject) => {
        if (packageCache) return resolve(packageCache);

        exec(
            'powershell -NoProfile -Command "Get-AppxPackage | Select PackageFamilyName, InstallLocation | ConvertTo-Json"',
            { maxBuffer: 1024 * 1024 * 10 },
            (err, stdout) => {
                if (err) return reject(err);

                packageCache = JSON.parse(stdout);
                if (!Array.isArray(packageCache))
                    packageCache = [packageCache];

                resolve(packageCache);
            }
        );
    });
}

function resolveAppIdToPath(appId) {
    return new Promise((resolve) => {
        const ps = `try{$s=New-Object -ComObject Shell.Application;$f=$s.NameSpace("shell:AppsFolder");$i=$f.ParseName("${appId}");if($i){$i.Path}else{""}}catch{""}`;
        const enc = Buffer.from(ps, 'utf16le').toString('base64');
        exec(`powershell -NoProfile -EncodedCommand ${enc}`, { timeout: 5000 }, (err, stdout) => {
            if (err) { resolve(null); return; }
            const p = stdout.trim();
            resolve(p || null);
        });
    });
}

async function getAppIcon(appObj) {
    if (!appObj) return null;
    if (iconCache.has(appObj.name)) return iconCache.get(appObj.name);

    let iconResult = null;

    if (appObj.type === 'uwp') {
        const family = appObj.appId.split("!")[0];
        const packages = await loadPackages();
        const pkg = packages.find(p => p.PackageFamilyName === family);
        if (pkg) {
            const manifestPath = path.join(pkg.InstallLocation, "AppxManifest.xml");
            if (fs.existsSync(manifestPath)) {
                const xml = fs.readFileSync(manifestPath, "utf8");
                const match = xml.match(/Square44x44Logo="([^"]+)"/i) || xml.match(/Square150x150Logo="([^"]+)"/i);
                if (match) {
                    const relative = match[1].replace(/\//g, "\\");
                    const candidates = [
                        relative.replace(".png", ".scale-400.png"),
                        relative.replace(".png", ".scale-200.png"),
                        relative.replace(".png", ".scale-150.png"),
                        relative.replace(".png", ".scale-125.png"),
                        relative
                    ];
                    for (const candidate of candidates) {
                        const full = path.join(pkg.InstallLocation, candidate);
                        if (fs.existsSync(full)) { iconResult = full; break; }
                    }
                }
            }
        }
    } else if (appObj.type === 'linux') {
        const iconPath = resolveDesktopIcon(appObj.iconPath);
        if (iconPath) {
            try {
                const buf = fs.readFileSync(iconPath);
                const ext = path.extname(iconPath).slice(1).toLowerCase();
                iconResult = `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${buf.toString('base64')}`;
            } catch (e) {
                console.error('Linux icon read error:', e);
            }
        }
        if (!iconResult && appObj.targetPath) {
            const execPath = appObj.targetPath.replace(/%(u|U|f|F|i|c|k)/g, '').trim().split(/\s+/)[0].replace(/["']/g, '');
            try {
                const nativeImage = await app.getFileIcon(execPath, { size: 'small' });
                iconResult = nativeImage.toDataURL();
            } catch (e) {
                console.error('Linux icon extract error:', e);
            }
        }
    } else if (appObj.type === 'win32') {
        let target = appObj.iconPath || appObj.targetPath;
        if (!target && appObj.appId) {
            target = await resolveAppIdToPath(appObj.appId);
            if (target) appObj.targetPath = target;
        }
        if (target) {
            target = target.split(',')[0].trim();
            target = target.replace(/%([^%]+)%/g, (_, key) => process.env[key] || '');
            target = target.replace(/\//g, '\\');
            if (target && fs.existsSync(target)) {
                try {
                    const nativeImage = await app.getFileIcon(target, { size: 'small' });
                    iconResult = nativeImage.toDataURL();
                } catch (e) {
                    console.error('Icon extract error:', e);
                }
            }
        }
    }

    iconCache.set(appObj.name, iconResult);
    return iconResult;
}

var appList = [];
function getApps() {
  if (process.platform === 'linux') {
    getLinuxApps();
    return;
  }
  if (process.platform !== 'win32') return;
  const psScript = `$apps=@();$dirs=@([Environment]::GetFolderPath("CommonStartMenu"),[Environment]::GetFolderPath("StartMenu"));foreach($dir in $dirs){if(Test-Path $dir){Get-ChildItem $dir -Recurse -Filter *.lnk -ErrorAction SilentlyContinue|%{$n=[IO.Path]::GetFileNameWithoutExtension($_.Name);$t="";$i="";try{$s=New-Object -ComObject WScript.Shell;$c=$s.CreateShortcut($_.FullName);$t=$c.TargetPath;$i=$c.IconLocation}catch{};if($n){$apps+=[PSCustomObject]@{Name=$n;TargetPath=$t;IconLocation=$i}}}}};$apps|ConvertTo-Json -Compress`;
  const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

  exec(
    `powershell -NoProfile -EncodedCommand ${encoded}`,
    { maxBuffer: 1024 * 1024 * 10 },
    (err, stdout) => {
      if (err) { console.error('Start Menu scan error:', err); return; }
      try {
        var win32Apps = JSON.parse(stdout);
        if (!Array.isArray(win32Apps)) win32Apps = [win32Apps];
        for (const app of win32Apps) {
          if (app.Name) {
            const entry = { name: app.Name, appId: '', type: 'win32', targetPath: app.TargetPath || '', iconPath: app.IconLocation || '' };
            const idx = appList.findIndex(a => a.name === app.Name);
            if (idx >= 0) appList[idx] = entry; else appList.push(entry);
          }
        }
      } catch (e) { console.error('Parse error:', e); }
    }
  );

  exec(
    'powershell -NoProfile -Command "Get-StartApps | ConvertTo-Json"',
    { maxBuffer: 1024 * 1024 * 10 },
    (err, stdout) => {
      if (err) { console.error(err); return; }
      try {
        var apps = JSON.parse(stdout);
        if (!Array.isArray(apps)) apps = [apps];
        for (const app of apps) {
          if (app.Name && !appList.some(a => a.name === app.Name)) {
            const isUwp = app.AppID && app.AppID.includes('!');
            appList.push({ name: app.Name, appId: app.AppID || '', type: isUwp ? 'uwp' : 'win32', targetPath: '', iconPath: '' });
          }
        }
      } catch (e) { console.error('Parse error:', e); }
    }
  );
}
getApps();

console.log("valid apps found\nsearching for files...");

const filesForSearch = [];
const filesHash = {};
var initDirs = buildSearchDirs();
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
async function resolvePathForQuery(query, shouldOpen) {
  try {
    const appNames = appList.map(app => app.name);
    let closest = findBestMatch(query, appNames);
    if (closest && closest.score > 0.5) {
      const closestApp = appList[closest.index];
      if (shouldOpen) {
        console.log(closestApp.appId, closestApp.name);
        if (closestApp.type === 'linux') {
          launchLinuxApp(closestApp);
        } else if (closestApp.type === 'win32' && closestApp.targetPath) {
          exec(`start "" "${closestApp.targetPath}"`);
        } else {
          exec(`explorer.exe shell:AppsFolder\\${closestApp.appId}`);
        }
      }
      const icon = await getAppIcon(closestApp);
      return { ok: true, file: closestApp.name, action: (shouldOpen ? 'Open' : 'Found'), type: 'app', icon: icon };
    }

    closest = findBestMatchFiles(query, filesForSearch);
    if (!closest || closest.best === undefined) {
      return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
    }

    const filePath = filesHash[closest.best];
    if (shouldOpen) {
      if (process.platform === 'linux') {
        const child = spawn('xdg-open', [filePath], { detached: true, stdio: 'ignore' });
        child.unref();
      } else {
        exec(`start "" "${filePath}"`);
      }
    }
    return { ok: true, file: filePath, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
  } catch (err) {
    console.error('Failed to open app', err);
    return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
  }
}

module.exports = { resolvePathForQuery };
