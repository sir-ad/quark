// test_jxa.js
const { execSync } = require('child_process');

const jxaScript = `
ObjC.import('AppKit');
var pb = $.NSPasteboard.generalPasteboard;
var html = pb.stringForType("public.html");
if (html) {
  html.js;
} else {
  "";
}
`;

try {
    const start = Date.now();
    const html = execSync(`osascript -l JavaScript -e '${jxaScript.replace(/\n/g, ' ')}'`, { encoding: 'utf8' });
    const end = Date.now();
    console.log(`JXA Execution Time: ${end - start}ms`);
    console.log('HTML EXTRACTED VIA JXA:');
    console.log(html.substring(0, 500));
} catch (e) {
    console.log('JXA Failed:', e.message);
}
