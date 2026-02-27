const { execSync } = require('child_process');

const jxa = `
ObjC.import("AppKit");
var app = $.NSWorkspace.sharedWorkspace.frontmostApplication.localizedName.js;
app;
`;

try {
    const start = Date.now();
    // Using double quotes for the inner import to avoid shell quote mangling
    const app = execSync(`osascript -l JavaScript -e '${jxa.replace(/\n/g, ' ')}' 2>/dev/null`, { encoding: 'utf8' }).trim();
    const end = Date.now();
    console.log(`Active App: ${app} (Found in ${end - start}ms)`);
} catch (e) {
    console.error('JXA App Detection Failed:', e.message);
}
