const { execSync } = require('child_process');
const os = require('os');

function read() {
  let text = '';
  let html = '';
  try {
    const platform = os.platform();
    if (platform === 'darwin') {
      text = execSync('pbpaste', { encoding: 'utf8' }).toString();
      try {
        const hex = execSync(`osascript -e 'the clipboard as "HTML"' 2>/dev/null`, { encoding: 'utf8' });
        const match = hex.match(/«data HTML([0-9A-F]+)»/i);
        if (match) html = Buffer.from(match[1], 'hex').toString('utf8');
      } catch (e) { }
    } else if (platform === 'linux') {
      text = execSync('xclip -selection clipboard -o', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      try {
        html = execSync('xclip -selection clipboard -o -t text/html', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      } catch (e) { }
    } else if (platform === 'win32') {
      text = execSync('powershell -NoProfile -Command "Get-Clipboard -Format Text"', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).toString().replace(/\r\n$/, '');
      try {
        const ps = `Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.Clipboard]::GetText([Windows.Forms.TextDataFormat]::Html)`;
        let rawHtml = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).toString();
        const fragmentMatch = rawHtml.match(/<!--StartFragment-->(.*?)<!--EndFragment-->/is);
        if (fragmentMatch) {
          html = fragmentMatch[1];
        } else {
          html = rawHtml.replace(/^Version:.*?\r?\nStartHTML:.*?\r?\nEndHTML:.*?\r?\nStartFragment:.*?\r?\nEndFragment:.*?\r?\n/is, '');
        }
      } catch (e) { }
    }
  } catch (e) {
    return { text: '', html: '' };
  }
  return { text, html };
}

function writeHtml(html, plainText) {
  try {
    const platform = os.platform();
    if (platform === 'darwin') {
      // Use hex-encoded AppleScript to set both HTML and Plain Text flavors simultaneously.
      // This is the only way to ensure Electron apps (Teams/Slack) recognize the grid layout.
      const hexHtml = Buffer.from(html, 'utf8').toString('hex').toUpperCase();
      const hexText = Buffer.from(plainText, 'utf8').toString('hex').toUpperCase();

      const script = `
        set the clipboard to { «class HTML»: «data HTML${hexHtml}», Unicode text: (run script "«data utxt${hexText}»") }
      `;

      execSync(`osascript -e '${script.replace(/\n/g, ' ')}'`);
    } else if (platform === 'linux') {
      execSync('xclip -selection clipboard -t text/html', { input: html, stdio: ['pipe', 'ignore', 'ignore'] });
    } else if (platform === 'win32') {
      const payload = `Version:0.9\r\nStartHTML:0000000000\r\nEndHTML:0000000000\r\nStartFragment:0000000000\r\nEndFragment:0000000000\r\n<html><body><!--StartFragment-->${html}<!--EndFragment--></body></html>`;
      const base64Html = Buffer.from(payload, 'utf8').toString('base64');
      const ps = `
        Add-Type -AssemblyName System.Windows.Forms
        $bytes = [System.Convert]::FromBase64String('${base64Html}')
        $html = [System.Text.Encoding]::UTF8.GetString($bytes)
        [Windows.Forms.Clipboard]::SetText($html, [Windows.Forms.TextDataFormat]::Html)
      `;
      execSync(`powershell -NoProfile -Command -`, { input: ps, stdio: ['pipe', 'ignore', 'ignore'] });
    }
  } catch (e) { console.error('Error setting clipboard HTML:', e.message); }
}

function writeText(text) {
  try {
    const platform = os.platform();
    if (platform === 'darwin') {
      execSync('pbcopy', { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
    } else if (platform === 'linux') {
      execSync('xclip -selection clipboard -i', { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
    } else if (platform === 'win32') {
      const base64Text = Buffer.from(text, 'utf8').toString('base64');
      const ps = `
        $bytes = [System.Convert]::FromBase64String('${base64Text}')
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        Set-Clipboard -Value $text
      `;
      execSync(`powershell -NoProfile -Command -`, { input: ps, stdio: ['pipe', 'ignore', 'ignore'] });
    }
  } catch (e) { console.error('Error setting clipboard text:', e.message); }
}

module.exports = { read, writeHtml, writeText };
