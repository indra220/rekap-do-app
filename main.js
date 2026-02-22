/* eslint-disable */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const Database = require('better-sqlite3');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// 1. Inisialisasi Database
const dbPath = path.join(app.getPath('userData'), 'rekap_do_v2.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Pembuatan tabel rekap_do beserta PRIMARY KEY
db.exec(`
  CREATE TABLE IF NOT EXISTS rekapdotemplate (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS solistdata (id TEXT PRIMARY KEY, content TEXT, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS rekap_do (
    no_do TEXT PRIMARY KEY, 
    customer TEXT, 
    tanggal TEXT, 
    item TEXT, 
    jumlah REAL
  );
`);

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

ipcMain.handle('save-imported-data', async (event, data) => {
  try {
    const insert = db.prepare(`
      INSERT INTO rekap_do (no_do, customer, tanggal, item, jumlah) 
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(no_do) DO UPDATE SET 
        customer=excluded.customer, 
        tanggal=excluded.tanggal, 
        item=excluded.item, 
        jumlah=excluded.jumlah
    `);

    // Menggunakan transaction untuk kecepatan
    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        insert.run(row.no_do, row.customer, row.tanggal, row.item, row.jumlah);
      }
    });

    insertMany(data);
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan data import ke SQLite:", error);
    return { success: false, error: error.message };
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

// =========================================================
// FITUR BARU: API UNTUK MENGAMBIL RIWAYAT UPDATE DARI GITHUB
// =========================================================
ipcMain.handle('get-patch-history', async () => {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'rekap-do-app-electron'
    };

    // Mengambil Releases, Tags, dan Commits secara paralel
    const [releaseRes, tagsRes, commitsRes] = await Promise.all([
      fetch('https://api.github.com/repos/indra220/rekap-do-app/releases', { headers }),
      fetch('https://api.github.com/repos/indra220/rekap-do-app/tags', { headers }),
      fetch('https://api.github.com/repos/indra220/rekap-do-app/commits', { headers })
    ]);
    
    const releases = releaseRes.ok ? await releaseRes.json() : [];
    const tags = tagsRes.ok ? await tagsRes.json() : [];
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    
    return releases.map(r => {
      let notes = r.body;

      // Jika catatan rilis dari GitHub kosong, cari deskripsi dari pesan commit
      if (!notes || notes.trim() === "") {
        const tag = tags.find(t => t.name === r.tag_name);
        if (tag) {
          const commit = commits.find(c => c.sha === tag.commit.sha);
          if (commit) {
            notes = commit.commit.message;
          }
        }
      }

      // Fallback terakhir jika rilis maupun commit benar-benar tidak memiliki deskripsi
      if (!notes || notes.trim() === "") {
         notes = "Pembaruan sistem dan perbaikan minor.";
      }

      return {
        version: r.tag_name,
        date: new Date(r.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        notes: notes
      };
    });
  } catch (e) {
    console.error("Gagal melakukan proses fetch dari GitHub:", e);
    return [];
  }
});
// =========================================================

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

  // Konfigurasi Auto Updater untuk Repositori Publik
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'indra220',
    repo: 'rekap-do-app'
  });

  autoUpdater.autoDownload = false;

  mainWindow.webContents.once('did-finish-load', () => {
    // Langsung cek update karena repo sudah publik
    autoUpdater.checkForUpdates();
  });
};

// --- EVENT AUTO UPDATER ---

autoUpdater.on('update-available', (info) => {
  if (mainWindow) mainWindow.webContents.send('update-tersedia', info);
});

autoUpdater.on('checking-for-update', () => {
  if (mainWindow) mainWindow.webContents.send('update-sedang-dicek');
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) mainWindow.webContents.send('update-download-progress', progressObj);
});

autoUpdater.on('update-not-available', () => {
  if (mainWindow) mainWindow.webContents.send('update-tidak-ada');
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) mainWindow.webContents.send('update-selesai-didownload');
});

autoUpdater.on('error', (err) => {
  console.error("AutoUpdater Error:", err);
  if (mainWindow) mainWindow.webContents.send('update-error', err.message);
});

// IPC untuk aksi Update
ipcMain.on('mulai-download-update', () => {
  autoUpdater.downloadUpdate().catch(err => {
    if (mainWindow) mainWindow.webContents.send('update-error', err.message);
  });
});

ipcMain.on('cek-update-otomatis', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('install-dan-restart', () => {
  autoUpdater.quitAndInstall(true, true);
});

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });