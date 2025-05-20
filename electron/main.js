import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
    });

    // Geliştirme modunda localhost:3000'i, production'da build edilmiş dosyaları yükle
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../.next/server/app/page.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Hata yakalama
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Sayfa yükleme hatası:', errorCode, errorDescription);
    });
}

// Electron hazır olduğunda pencereyi oluştur
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Tüm pencereler kapatıldığında uygulamayı sonlandır (macOS hariç)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Hata yakalama
process.on('uncaughtException', (error) => {
    console.error('Yakalanmamış hata:', error);
}); 