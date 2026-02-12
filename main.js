/* eslint-disable */
require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const Database = require('better-sqlite3');
const { autoUpdater } = require("electron-updater");

// Konfigurasi AutoUpdate untuk Repo Private
autoUpdater.requestHeaders = { "Authorization": `token ${process.env.GH_TOKEN}` };
autoUpdater.autoDownload = false; // Kita biarkan user klik download manual jika mau

const dbPath = path.join(app.getPath('userData'), 'rekap_do_v2.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS rekapdotemplate (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS solistdata (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
`);

ipcMain.handle('db-get-init', () => {
  const template = db.prepare("SELECT content FROM rekapdotemplate WHERE id = 'current_session'").get();
  const solist = db.prepare("SELECT content FROM solistdata WHERE id = 'current_session'").get();
  return { template: template ? JSON.parse(template.content) : null, solist: solist ? JSON.parse(solist.content) : null };
});

ipcMain.handle('db-save', (event, { table, id, data }) => {
  const upsert = db.prepare(`INSERT INTO ${table} (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET content=excluded.content, updatedAt=CURRENT_TIMESTAMP`);
  return upsert.run(id, JSON.stringify(data));
});

ipcMain.handle('get-app-version', () => app.getVersion());

// Handler Pengecekan Update Real
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { hasUpdate: result.updateInfo.version !== app.getVersion(), info: result.updateInfo };
  } catch (e) {
    return { error: e.message };
  }
});

const appServe = app.isPackaged ? serve({ directory: path.join(__dirname, 'out') }) : null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1400, height: 950,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  if (app.isPackaged) { appServe(win).then(() => win.loadURL('app://-')); } 
  else { win.loadURL('http://127.0.0.1:3000'); }
};

app.on('ready', createWindow);