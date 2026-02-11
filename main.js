/* eslint-disable */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const Database = require('better-sqlite3');

// 1. Inisialisasi Database di Folder User Data
const dbPath = path.join(app.getPath('userData'), 'rekap_do_v2.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Membuat tabel secara otomatis jika belum ada (Auto-Migration)
db.exec(`
  CREATE TABLE IF NOT EXISTS rekapdotemplate (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS solistdata (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
`);

// Handler untuk mengambil data awal (Single-trip IPC)
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

// Handler universal untuk menyimpan data
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
  const win = new BrowserWindow({
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

  win.once('ready-to-show', () => {
    win.show();
  });

  if (app.isPackaged) {
    appServe(win).then(() => { win.loadURL('app://-'); });
  } else {
    // Menggunakan IP 127.0.0.1 agar startup di VS Code lebih cepat
    const loadDevServer = () => {
      win.loadURL('http://127.0.0.1:3000').catch(() => {
        setTimeout(loadDevServer, 500);
      });
    };
    loadDevServer();
  }
};

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });