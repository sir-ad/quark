const { execSync } = require('child_process');

function testBridge() {
    const html = '<table><tr><td>DEBUG_WORKS</td></tr></table>';
    const text = 'DEBUG_WORKS';

    console.log('--- Writing to Clipboard ---');
    const writeJxa = `
ObjC.import("AppKit");
var pb = $.NSPasteboard.generalPasteboard;
pb.clearContents;
pb.setStringForType($('${html}'), $("public.html"));
pb.setStringForType($('${text}'), $("public.utf8-plain-text"));
"ok";
  `.trim();

    try {
        // Note: This still uses shell injection for the test, but it's just to check JXA connectivity
        execSync(`osascript -l JavaScript -e '${writeJxa.replace(/'/g, "'\\''")}'`);
        console.log('Write executed.');
    } catch (e) {
        console.error('Write failed:', e.message);
    }

    console.log('\n--- Reading back from Clipboard ---');
    const readJxa = `
ObjC.import("AppKit");
var pb = $.NSPasteboard.generalPasteboard;
var h = pb.stringForType("public.html");
var t = pb.stringForType("public.utf8-plain-text");
JSON.stringify({
  html: h ? h.js : null,
  text: t ? t.js : null,
  types: Array.from({length: pb.types.count}, (_, i) => pb.types.objectAtIndex(i).js)
});
  `.trim();

    try {
        const raw = execSync(`osascript -l JavaScript -e '${readJxa.replace(/'/g, "'\\''")}'`, { encoding: 'utf8' });
        console.log('Read output:', raw);
        const result = JSON.parse(raw);
        console.log('Parsed result:', result);
    } catch (e) {
        console.error('Read failed:', e.message);
    }
}

testBridge();
