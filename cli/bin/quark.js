#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { installService, uninstallService } = require('../src/installer');

const command = process.argv[2] || 'help';
const daemonPath = path.join(__dirname, '../src/daemon.js');
const mcpPath = path.join(__dirname, '../src/mcp.js');

// Bug fix: write state files to ~/.quark/ instead of inside the package dir (which
// can be read-only when installed globally via npm).
const quarkDir = path.join(os.homedir(), '.quark');
fs.mkdirSync(quarkDir, { recursive: true });
const pidFile = path.join(quarkDir, 'quark.pid');
const logFile = path.join(quarkDir, 'quark.log');

switch (command) {
  case 'run': {
    console.log(`
      o-------o
      | \\   / |
      |   o   |
      | /   \\ |
      o-------o
    `);
    console.log('🚀 Starting Quark Daemon (Foreground Session)...');
    console.log('💡 Press Ctrl+C to stop. Logs will appear below:');
    require(daemonPath);
    break;
  }

  case 'logs': {
    if (fs.existsSync(logFile)) {
      console.log('📜 Tailing Quark logs... (Press Ctrl+C to exit)');
      const tail = spawn('tail', ['-f', logFile], { stdio: 'inherit' });
      tail.on('exit', () => process.exit(0));
    } else {
      console.log('⚠️ No log file found at ' + logFile);
    }
    break;
  }

  case 'start': {
    console.log(`
      o-------o
      | \\   / |
      |   o   |
      | /   \\ |
      o-------o
    `);
    console.log('🚀 Starting Quark Daemon (Temporary Session)...');
    if (fs.existsSync(pidFile)) {
      console.log('⚠️ Quark is already running. Run `quark stop` first.');
      process.exit(1);
    }
    const out = fs.openSync(logFile, 'a');
    const err = fs.openSync(logFile, 'a');
    // Bug fix: use process.execPath so the correct node binary is used even
    // inside nvm / fnm / volta managed environments.
    const child = spawn(process.execPath, [daemonPath], {
      detached: true,
      stdio: ['ignore', out, err]
    });
    fs.writeFileSync(pidFile, child.pid.toString());
    child.unref();
    console.log('✨ Quark is now orbiting your clipboard in the background.');
    console.log('💡 Tip: Run `quark install` to make it start automatically on boot.');
    break;
  }

  case 'stop': {
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf8');
      try {
        process.kill(parseInt(pid, 10));
        console.log('🛑 Quark Daemon stopped.');
      } catch (e) {
        console.log('⚠️ Quark process not found. Cleaning up pid file.');
      }
      fs.unlinkSync(pidFile);
    } else {
      console.log('Quark is not running via manual start.');
    }
    break;
  }

  case 'install':
    installService();
    break;

  case 'uninstall':
    uninstallService();
    break;

  case 'status': {
    const isRunning = fs.existsSync(pidFile);
    console.log(`\n🌌 Quark Status`);
    console.log(`----------------`);
    console.log(`Manual Session: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`);

    // Check OS Service Status
    const platform = os.platform();
    let serviceRunning = false;
    try {
      if (platform === 'darwin') {
        const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.quark.daemon.plist');
        if (fs.existsSync(plistPath)) {
          const svcOut = require('child_process').execSync('launchctl list | grep com.quark.daemon', { encoding: 'utf8' });
          serviceRunning = svcOut.includes('com.quark.daemon');
        }
      } else if (platform === 'linux') {
        const servicePath = path.join(os.homedir(), '.config', 'systemd', 'user', 'quark.service');
        if (fs.existsSync(servicePath)) {
          const svcOut = require('child_process').execSync('systemctl --user is-active quark.service', { encoding: 'utf8' });
          serviceRunning = svcOut.trim() === 'active';
        }
      } else if (platform === 'win32') {
        const vbsPath = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'quark.vbs');
        if (fs.existsSync(vbsPath)) {
          const svcOut = require('child_process').execSync('wmic process where "CommandLine like \'%daemon.js%\'" get ProcessId', { encoding: 'utf8' });
          serviceRunning = svcOut.includes('ProcessId') && svcOut.trim().split('\n').length > 1;
        }
      }
    } catch (e) {
      // Ignore errors from execSync if service is not running
    }

    console.log(`OS Service:     ${serviceRunning ? '🟢 Installed & Running' : '🔴 Not Installed / Stopped'}`);
    console.log(`\nLog file: ${logFile}`);
    if (!serviceRunning) {
      console.log(`\n💡 Tip: Run 'quark install' to configure auto-start on boot.`);
    }
    break;
  }

  case 'mcp':
    // Starts the MCP Stdio server (used by LLMs like Claude Desktop)
    require(mcpPath);
    break;

  default:
    console.log(`
🌌 Quark CLI

Usage:
  quark start      Start the daemon in the background (current session)
  quark stop       Stop the manually started daemon
  quark run        Start the daemon in the foreground (live logs)
  quark logs       Tail the background daemon logs
  quark install    Install Quark as a native OS background service (Auto-start on boot)
  quark uninstall  Remove the native OS background service
  quark status     Check daemon status
  quark mcp        Start the MCP Server (used by LLMs via stdio)
    `);
}
