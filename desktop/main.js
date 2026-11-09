// Desktop app: a window around the hosted web app. The web app's service worker and Firestore
// cache live in this app's own storage, so it keeps working offline after the first sign-in.
const { app, BrowserWindow, shell } = require('electron');

const APP_URL = 'https://class-helper-f79f7.web.app';
const APP_HOST = new URL(APP_URL).host;
// Google refuses sign-in from browsers that say "Electron", so present as plain Chrome.
const USER_AGENT = `Mozilla/5.0 (${process.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'Windows NT 10.0; Win64; x64'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
// The Google sign-in popup has to stay inside the app so it can hand the sign-in back.
const isSignIn = (url) => /^https:\/\/(accounts\.google\.com|[^/]+\.firebaseapp\.com\/__\/auth\/)/.test(url);

if (!app.requestSingleInstanceLock()) app.quit();

function createWindow() {
  const win = new BrowserWindow({ width: 1280, height: 860, minWidth: 380, title: 'Elementary Class Record', autoHideMenuBar: true });
  win.webContents.setUserAgent(USER_AGENT);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isSignIn(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 500, height: 680, autoHideMenuBar: true } };
    shell.openExternal(url); // anything else (mailto, privacy.gov.ph...) opens in the normal browser
    return { action: 'deny' };
  });
  // Links leaving the app open in the normal browser; downloads (Excel, zip) use the save dialog as usual.
  win.webContents.on('will-navigate', (e, url) => {
    if (new URL(url).host !== APP_HOST && !isSignIn(url)) { e.preventDefault(); shell.openExternal(url); }
  });
  win.loadURL(`${APP_URL}/class`);
  return win;
}

app.userAgentFallback = USER_AGENT; // also covers the sign-in popup window
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length || createWindow());
});
app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
