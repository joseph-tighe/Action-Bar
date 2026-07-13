const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const { BrowserWindow } = require("electron");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let lastUpdateState = null;
let checkTimeout = null;

function sendToAllWindows(channel, data) {
    lastUpdateState = data;
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send(channel, data);
        }
    }
}

function getLastState() {
    return lastUpdateState;
}

function initialize(settings) {
    if (!settings || !settings.updates || !settings.updates.enabled)
        return;

    autoUpdater.autoDownload =
        settings.updates.downloadAutomatically;

    if (settings.updates.checkOnStartup) {
        checkTimeout = setTimeout(() => {
            autoUpdater.checkForUpdates().catch(err => {
                log.error("checkForUpdates failed:", err);
            });
        }, 15000);
    }
}

function stop() {
    if (checkTimeout) {
        clearTimeout(checkTimeout);
        checkTimeout = null;
    }
}

autoUpdater.on("update-available", () => {
    if (!autoUpdater.autoDownload) {
        autoUpdater.downloadUpdate().catch(err => {
            log.error("downloadUpdate failed:", err);
        });
    }
    sendToAllWindows("updateModal", {
        progress: 0,
        error: null,
        isUpdateAvailable: true,
        isDownloading: true,
        isDone: false
    });
});

autoUpdater.on("update-not-available", () => {
    sendToAllWindows("updateModal", {
        progress: 0,
        error: null,
        isUpdateAvailable: false,
        isDownloading: false,
        isDone: true
    });
});

autoUpdater.on("download-progress", progress => {
    sendToAllWindows("updateModal", {
        progress: progress.percent,
        error: null,
        isUpdateAvailable: true,
        isDownloading: true,
        isDone: false
    });
});

autoUpdater.on("update-downloaded", () => {
    sendToAllWindows("updateModal", {
        progress: 100,
        error: null,
        isUpdateAvailable: true,
        isDownloading: false,
        isDone: true
    });
});

autoUpdater.on("error", err => {
    sendToAllWindows("updateModal", {
        progress: 0,
        error: (err && err.message) || String(err || "Unknown error"),
        isUpdateAvailable: false,
        isDownloading: false,
        isDone: false
    });
});

function quitAndInstall() {
    autoUpdater.quitAndInstall();
}

module.exports = { initialize, quitAndInstall, stop, getLastState };
