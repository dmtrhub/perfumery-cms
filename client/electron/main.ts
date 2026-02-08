import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let win: BrowserWindow | null = null

const GATEWAY_URL = 'http://localhost:5000'

const preloadPath = import.meta.env.VITE_PRODUCTION
  ? path.join(__dirname, '../dist-electron/preload.mjs')
  : path.join(__dirname, '../src/preload.mjs')

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    fullscreen: false,
    frame: false,
    backgroundColor: '#202020',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  Menu.setApplicationMenu(null)

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  //win?.maximize()

  win?.webContents.openDevTools();
  
  // IPC handlers - Window controls
  ipcMain.on('window:minimize', () => win?.minimize())
  ipcMain.on('window:maximize', () => {
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
    win.webContents.send('window:maximized', win.isMaximized())
  })
  ipcMain.on('window:close', () => win?.close())

  // IPC handler - OAuth 2.0
  ipcMain.on('oauth:open', (_event, provider: string) => {
    openOAuthWindow(provider)
  })

  // Keep renderer in sync
  win.on('maximize', () => win?.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win?.webContents.send('window:maximized', false))
}

/**
 * Otvara OAuth prozor za autentifikaciju putem Google ili GitHub provajdera
 * Prati navigaciju i izvlači JWT token nakon uspešne autentifikacije
 */
function openOAuthWindow(provider: string) {
  const oauthWin = new BrowserWindow({
    width: 600,
    height: 700,
    parent: win || undefined,
    modal: true,
    show: false,
    backgroundColor: '#202020',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const oauthUrl = `${GATEWAY_URL}/auth/${provider}`
  oauthWin.loadURL(oauthUrl)
  oauthWin.once('ready-to-show', () => oauthWin.show())

  // Prati sve navigacije za ekstrakciju tokena
  const handleNavigation = (url: string) => {
    try {
      const parsedUrl = new URL(url)

      // Proveri da li je stigao na oauth-success stranicu
      if (parsedUrl.pathname.includes('/oauth-success')) {
        const token = parsedUrl.searchParams.get('token')
        const error = parsedUrl.searchParams.get('error')

        if (token) {
          // Pošalji token renderer procesu
          win?.webContents.send('oauth:token', token)
        } else if (error) {
          win?.webContents.send('oauth:error', error)
        }

        // Zatvori OAuth prozor nakon kratke pauze (da korisnik vidi poruku)
        setTimeout(() => {
          if (!oauthWin.isDestroyed()) {
            oauthWin.close()
          }
        }, 1000)
      }
    } catch {
      // Ignoriši nevažeće URL-ove
    }
  }

  oauthWin.webContents.on('will-navigate', (_event, url) => handleNavigation(url))
  oauthWin.webContents.on('did-navigate', (_event, url) => handleNavigation(url))
  oauthWin.webContents.on('will-redirect', (_event, url) => handleNavigation(url))

  // Obrada zatvaranja prozora bez uspešne autentifikacije
  oauthWin.on('closed', () => {
    // Korisnik je zatvorio prozor ručno
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
