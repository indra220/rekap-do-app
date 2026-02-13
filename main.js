/* eslint-disable */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const Database = require('better-sqlite3');
const { autoUpdater } = require('electron-updater');

let mainWindow; // Variabel global untuk jendela utama

// 1. Inisialisasi Database
const dbPath = path.join(app.getPath('userData'), 'rekap_do_v2.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rekapdotemplate (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS solistdata (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
`);

// IPC Handlers untuk Database
ipcMain.handle('db-get-init', () => {
  try {
    const template = db.prepare("SELECT content FROM rekapdotemplate WHERE id = 'current_session'").get();
    const solist = db.prepare("SELECT content FROM solistdata WHERE id = 'current_session'").get();
    return {
      template: template ? JSON.parse(template.content) : null,
      solist: solist ? JSON.parse(solist.content) : null
    };
  } catch (e) {
    return { template: null, solist: null };
  }
});

ipcMain.handle('db-save', (event, { table, id, data }) => {
  try {
    const upsert = db.prepare(`
      INSERT INTO ${table} (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET content=excluded.content, updatedAt=CURRENT_TIMESTAMP
    `);
    return upsert.run(id, JSON.stringify(data));
  } catch (e) {
    console.error("Gagal simpan ke SQLite:", e);
    throw e;
  }
});

const appServe = app.isPackaged ? serve({ directory: path.join(__dirname, 'out') }) : null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 950,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (app.isPackaged) {
    appServe(mainWindow).then(() => { mainWindow.loadURL('app://-'); });
  } else {
    const loadDevServer = () => {
      mainWindow.loadURL('http://127.0.0.1:3000').catch(() => {
        setTimeout(loadDevServer, 500);
      });
    };
    loadDevServer();
  }

  // Konfigurasi Auto Updater
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'indra220',
    repo: 'rekap-do-app',
    private: true,
    token: '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' 
  });

  autoUpdater.autoDownload = false;

  // Cek update saat aplikasi selesai memuat
  mainWindow.webContents.once('did-finish-load', () => {
    autoUpdater.checkForUpdates();
  });
};

// Event Auto Updater
autoUpdater.on('update-available', (info) => {
  if (mainWindow) mainWindow.webContents.send('update-tersedia', info);
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) mainWindow.webContents.send('update-selesai-didownload');
});

// IPC untuk aksi Update
ipcMain.on('mulai-download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-dan-restart', () => {
  autoUpdater.quitAndInstall();
});

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });