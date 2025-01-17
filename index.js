const { app, BrowserWindow, screen, session, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Config file path in user data directory
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

// Default config
const DEFAULT_CONFIG = {
    protectUrl: 'https://10.0.1.58/protect/dashboard/all',
    displayIndex: 2,
    isConfigured: true
};

// Function to load config
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return DEFAULT_CONFIG;
}

// Function to save config
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

function createConfigWindow() {
    const displays = screen.getAllDisplays();
    
    const configWin = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const configHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>UniFi Protect Configuration</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                input, select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-sizing: border-box;
                }
                button {
                    background: #2196F3;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background: #1976D2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>UniFi Protect Configuration</h2>
                <form id="configForm">
                    <div class="form-group">
                        <label for="protectUrl">Protect URL:</label>
                        <input type="text" id="protectUrl" placeholder="https://your-protect-ip/protect/dashboard/all" required>
                    </div>
                    <div class="form-group">
                        <label for="displayIndex">Select Display:</label>
                        <select id="displayIndex">
                            ${displays.map((display, index) => `
                                <option value="${index}">
                                    Display ${index + 1} (${display.bounds.width}x${display.bounds.height})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <button type="submit">Save Configuration</button>
                </form>
            </div>
            <script>
                const { ipcRenderer } = require('electron');
                const config = ${JSON.stringify(loadConfig())};
                
                document.getElementById('protectUrl').value = config.protectUrl;
                document.getElementById('displayIndex').value = config.displayIndex;

                document.getElementById('configForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const newConfig = {
                        protectUrl: document.getElementById('protectUrl').value,
                        displayIndex: parseInt(document.getElementById('displayIndex').value),
                        isConfigured: false
                    };
                    ipcRenderer.send('save-config', newConfig);
                });
            </script>
        </body>
        </html>
    `;

    const tempPath = path.join(app.getPath('temp'), 'config.html');
    fs.writeFileSync(tempPath, configHtml);
    
    configWin.loadFile(tempPath);
    return configWin;
}

function createMainWindow(config) {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays[config.displayIndex];

    if (!targetDisplay) {
        console.error(`Monitor #${config.displayIndex + 1} not found. Falling back to primary display.`);
    }

    const bounds = targetDisplay ? targetDisplay.bounds : screen.getPrimaryDisplay().bounds;

    const win = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: 1920,
        height: 1080,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            sandbox: false
        }
    });

    // Ignore SSL errors
    app.commandLine.appendSwitch('ignore-certificate-errors');
    app.commandLine.appendSwitch('allow-insecure-localhost');

    win.webContents.session.setCertificateVerifyProc((request, callback) => {
        callback(0);
    });

    // Set a custom User-Agent
    win.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    // Add authentication token
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    // Register shortcuts
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        win.webContents.isDevToolsOpened() 
            ? win.webContents.closeDevTools()
            : win.webContents.openDevTools();
    });

    // Add custom fullscreen shortcuts
    globalShortcut.register('CommandOrControl+Alt+X', () => {
        win.webContents.executeJavaScript('window.triggerFullScreen()', true)
            .catch(err => console.error('Error triggering fullscreen:', err));
    });

    globalShortcut.register('Escape', () => {
        win.webContents.executeJavaScript('window.exitFullScreen()', true)
            .catch(err => console.error('Error exiting fullscreen:', err));
    });

    win.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully.');

        // Wait for the UI to be fully loaded
        setTimeout(() => {
            win.webContents.executeJavaScript(`
                // Function to find and click buttons
                function triggerFullScreen() {
                    const buttonGroup = document.querySelector('.LiveviewControls__ButtonGroup-sc-6n7ics-1');
                    if (buttonGroup) {
                        const buttons = Array.from(buttonGroup.querySelectorAll('button'));
                        if (buttons.length > 0) {
                            const lastButton = buttons[buttons.length - 1];
                            lastButton.click();
                            console.log('Clicked fullscreen button');
                        }
                    }
                }

                // Function to exit fullscreen
                function exitFullScreen() {
                    const buttonGroup = document.querySelector('.LiveviewControls__ButtonGroup-sc-6n7ics-1');
                    if (buttonGroup) {
                        const buttons = Array.from(buttonGroup.querySelectorAll('button'));
                        if (buttons.length > 0) {
                            const fullscreenButton = buttons[buttons.length - 1];
                            if (document.fullscreenElement) {
                                fullscreenButton.click();
                            }
                        }
                    }
                }

                // Add these functions to window object so they can be called from main process
                window.triggerFullScreen = triggerFullScreen;
                window.exitFullScreen = exitFullScreen;

                // Execute once after page load
                triggerFullScreen();
            `, true)
            .catch(err => console.error('Error executing fullscreen script:', err));
        }, 20000); // Keep 20 second delay as it worked
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Page failed to load: ${errorDescription} (Code: ${errorCode})`);
    });

    win.loadURL(config.protectUrl);
    win.setMenuBarVisibility(false);

    return win;
}

let mainWindow = null;

// Fix for taskbar icon in Windows
if (process.platform === 'win32') {
    app.setAppUserModelId(app.getName());
}

app.whenReady().then(() => {
    const config = loadConfig();
    
    if (!config.isConfigured) {
        const configWindow = createConfigWindow();
        
        const { ipcMain } = require('electron');
        
        ipcMain.on('save-config', (event, newConfig) => {
            saveConfig(newConfig);
            configWindow.close();
            mainWindow = createMainWindow(newConfig);
        });
    } else {
        mainWindow = createMainWindow(config);
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});