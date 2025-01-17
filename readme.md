# UniFi Protect Electron Viewer

A dedicated Electron-based viewer application for UniFi Protect that launches your dashboard on a specific monitor with automatic full-screen capability.

## Features

### Core Functionality
- Launch UniFi Protect dashboard in a dedicated window
- Configure target display and dashboard URL
- Automatic full-screen mode on startup
- Custom keyboard shortcuts
- SSL certificate bypass for self-hosted instances
- Custom User-Agent to ensure compatibility

### Configuration
- First-run setup wizard
- Configurable dashboard URL
- Monitor selection with resolution display
- Persistent settings storage

### Keyboard Shortcuts
- `Ctrl/Cmd + Alt + X`: Trigger full-screen mode
- `Escape`: Exit full-screen mode
- `Ctrl/Cmd + Shift + I`: Toggle DevTools

### Technical Features
- SSL certificate verification bypass
- Custom User-Agent string
- Bearer token authentication support
- Multi-monitor support
- Windows taskbar icon fix

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Git

### Setup Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/unifi-protect-viewer.git
cd unifi-protect-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```

### Building for Production

To create a production build:
```bash
npm run build
```

## Technical Details

### Full-Screen Hack
The application includes a specialized hack to handle UniFi Protect's full-screen mode. It works by:
1. Waiting 20 seconds for the UI to fully load
2. Finding the full-screen button using class selectors
3. Programmatically triggering the click event
4. Providing keyboard shortcuts for manual control

### SSL Certificate Handling
The app bypasses SSL certificate verification for self-signed certificates commonly used in home lab setups:
```javascript
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost');
```

### Configuration System
Settings are stored in the user's app data directory:
- Windows: `%APPDATA%/unifi-protect-viewer/config.json`
- macOS: `~/Library/Application Support/unifi-protect-viewer/config.json`
- Linux: `~/.config/unifi-protect-viewer/config.json`

### User-Agent String
Uses a custom Chrome-based User-Agent to ensure compatibility:
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36
```

## Troubleshooting

### Reset Configuration
To reset the configuration:
1. Close the application
2. Delete the config file from your app data directory
3. Restart the application

### Full-Screen Issues
If automatic full-screen doesn't work:
1. Wait 30 seconds for complete UI load
2. Use `Ctrl/Cmd + Alt + X` to trigger manually
3. Check DevTools (Ctrl/Cmd + Shift + I) for errors

### SSL Certificate Errors
If you encounter SSL issues:
1. Ensure your UniFi Protect instance is accessible via browser
2. Check if your URL uses HTTPS
3. Verify the URL in the configuration matches your Protect instance

## Security Considerations

- SSL certificate verification is disabled
- Web security is disabled for compatibility
- Bearer token authentication is supported (requires manual configuration)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Disclaimer

This is an unofficial application and is not affiliated with or endorsed by Ubiquiti Inc.

