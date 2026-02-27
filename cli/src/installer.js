const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function installService() {
  const platform = os.platform();
  const nodePath = process.execPath;
  const daemonPath = path.join(__dirname, 'daemon.js');
  
  console.log(`
      o-------o
      | \\   / |
      |   o   |
      | /   \\ |
      o-------o
  `);
  console.log(`⚙️  Installing Quark as a background service on ${platform}...`);

  try {
    if (platform === 'darwin') {
      const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.quark.daemon.plist');
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.quark.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${daemonPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(os.homedir(), '.quark.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(os.homedir(), '.quark.err')}</string>
</dict>
</plist>`;
      
      fs.mkdirSync(path.dirname(plistPath), { recursive: true });
      fs.writeFileSync(plistPath, plistContent);
      try { execSync(`launchctl unload ${plistPath}`, { stdio: 'ignore' }); } catch(e) {}
      execSync(`launchctl load ${plistPath}`);
      console.log('✅ macOS LaunchAgent installed and started.');

    } else if (platform === 'linux') {
      const serviceDir = path.join(os.homedir(), '.config', 'systemd', 'user');
      const servicePath = path.join(serviceDir, 'quark.service');
      const serviceContent = `[Unit]
Description=Quark Clipboard Daemon
After=network.target

[Service]
ExecStart=${nodePath} ${daemonPath}
Restart=always
RestartSec=3
StandardOutput=append:%h/.quark.log
StandardError=append:%h/.quark.err

[Install]
WantedBy=default.target`;

      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(servicePath, serviceContent);
      execSync('systemctl --user daemon-reload');
      execSync('systemctl --user enable --now quark.service');
      console.log('✅ Linux systemd service installed and started.');

    } else if (platform === 'win32') {
      const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
      const vbsPath = path.join(startupDir, 'quark.vbs');
      const vbsContent = `Set WshShell = CreateObject("WScript.Shell")\nWshShell.Run """${nodePath}"" ""${daemonPath}""", 0, False`;
      
      fs.mkdirSync(startupDir, { recursive: true });
      fs.writeFileSync(vbsPath, vbsContent);
      
      // Start it immediately for this session
      execSync(`wscript "${vbsPath}"`);
      console.log('✅ Windows Startup script installed and started.');
    } else {
      console.log(`⚠️ Unsupported OS for automatic installation: ${platform}`);
    }
  } catch (error) {
    console.error('❌ Failed to install service:', error.message);
  }
}

function uninstallService() {
  const platform = os.platform();
  console.log(`\n🗑️  Uninstalling Quark service from ${platform}...`);

  try {
    if (platform === 'darwin') {
      const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.quark.daemon.plist');
      if (fs.existsSync(plistPath)) {
        execSync(`launchctl unload ${plistPath}`);
        fs.unlinkSync(plistPath);
      }
    } else if (platform === 'linux') {
      const servicePath = path.join(os.homedir(), '.config', 'systemd', 'user', 'quark.service');
      if (fs.existsSync(servicePath)) {
        execSync('systemctl --user disable --now quark.service');
        fs.unlinkSync(servicePath);
        execSync('systemctl --user daemon-reload');
      }
    } else if (platform === 'win32') {
      const vbsPath = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'quark.vbs');
      if (fs.existsSync(vbsPath)) {
        fs.unlinkSync(vbsPath);
        // Kill node processes running daemon.js (simplified)
        try { execSync(`wmic process where "CommandLine like '%daemon.js%'" call terminate`, { stdio: 'ignore' }); } catch(e) {}
      }
    }
    console.log('✅ Service uninstalled successfully.');
  } catch (error) {
    console.error('❌ Failed to uninstall service:', error.message);
  }
}

module.exports = { installService, uninstallService };
