import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
let win = null;
const GATEWAY_URL = "http://localhost:5000";
const preloadPath = path.join(__dirname$1, "../dist-electron/preload.mjs");
function createWindow() {
  win = new BrowserWindow({
    width: 1e3,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    fullscreen: false,
    frame: false,
    backgroundColor: "#202020",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  Menu.setApplicationMenu(null);
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
  win?.webContents.openDevTools();
  ipcMain.on("window:minimize", () => win?.minimize());
  ipcMain.on("window:maximize", () => {
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
    win.webContents.send("window:maximized", win.isMaximized());
  });
  ipcMain.on("window:close", () => win?.close());
  ipcMain.on("oauth:open", (_event, provider) => {
    openOAuthWindow(provider);
  });
  win.on("maximize", () => win?.webContents.send("window:maximized", true));
  win.on("unmaximize", () => win?.webContents.send("window:maximized", false));
}
function openOAuthWindow(provider) {
  const oauthWin = new BrowserWindow({
    width: 600,
    height: 700,
    parent: win || void 0,
    modal: true,
    show: false,
    backgroundColor: "#202020",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const oauthUrl = `${GATEWAY_URL}/auth/${provider}`;
  oauthWin.loadURL(oauthUrl);
  oauthWin.once("ready-to-show", () => oauthWin.show());
  const handleNavigation = (url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname.includes("/oauth-success")) {
        const token = parsedUrl.searchParams.get("token");
        const error = parsedUrl.searchParams.get("error");
        if (token) {
          win?.webContents.send("oauth:token", token);
        } else if (error) {
          win?.webContents.send("oauth:error", error);
        }
        setTimeout(() => {
          if (!oauthWin.isDestroyed()) {
            oauthWin.close();
          }
        }, 1e3);
      }
    } catch {
    }
  };
  oauthWin.webContents.on("will-navigate", (_event, url) => handleNavigation(url));
  oauthWin.webContents.on("did-navigate", (_event, url) => handleNavigation(url));
  oauthWin.webContents.on("will-redirect", (_event, url) => handleNavigation(url));
  oauthWin.on("closed", () => {
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
