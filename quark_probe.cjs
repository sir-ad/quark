#!/usr/bin/env node
/**
 * Quark Pipeline Probe v1.2
 * Run from project root: node quark_probe.cjs
 */
const { execSync } = require('child_process');
const path = require('path');

const PROJECT = path.resolve(__dirname);
const clipboardModule = require(path.join(PROJECT, 'cli/src/clipboard'));
const transformers = require(path.join(PROJECT, 'cli/src/transformers'));

(async () => {
    console.log('═══ QUARK PIPELINE PROBE v1.2 ═══\n');

    // STAGE 0: Raw pasteboard types
    console.log('▶ STAGE 0: Raw OS Clipboard');
    try {
        const types = execSync(
            `osascript -l JavaScript -e 'ObjC.import("AppKit"); var pb = $.NSPasteboard.generalPasteboard; var types = pb.types; var arr = []; for (var i = 0; i < types.count; i++) { arr.push(types.objectAtIndex(i).js); } JSON.stringify(arr);'`,
            { encoding: 'utf8' }
        );
        console.log('Types:', types.trim());
    } catch (e) { console.log('ERROR:', e.message); }

    // STAGE 1: clipboard.read()
    console.log('\n▶ STAGE 1: clipboard.read()');
    const clip = clipboardModule.read();
    console.log(`text.length=${clip.text.length}  html.length=${clip.html.length}`);
    console.log(`html has <table>: ${clip.html.toLowerCase().includes('<table')}`);
    if (clip.html) console.log(`html[0..400]: ${clip.html.substring(0, 400)}`);
    if (clip.text) console.log(`text[0..200]: ${clip.text.substring(0, 200)}`);

    // STAGE 2-3: processClipboard()
    console.log('\n▶ STAGE 2-3: processClipboard()');
    const result = await transformers.processClipboard(clip.text, clip.html);
    console.log(`changed=${result.changed}  skipReason=${result.skipReason || 'none'}`);
    console.log(`has html=${!!result.html}  has md=${!!result.markdown}`);
    if (result.html) {
        console.log(`output has border: ${result.html.includes('border: 1px solid')}`);
        console.log(`output html[0..400]: ${result.html.substring(0, 400)}`);
    }

    // STAGE 4: writeHtml round-trip
    console.log('\n▶ STAGE 4: writeHtml() round-trip');
    const probe = '<table><tr><td>PROBE_OK</td></tr></table>';
    clipboardModule.writeHtml(probe, 'PROBE_OK');
    const after = clipboardModule.read();
    console.log(`write OK: ${after.html.includes('PROBE_OK')}`);
    const typesAfter = execSync(
        `osascript -l JavaScript -e 'ObjC.import("AppKit"); var pb = $.NSPasteboard.generalPasteboard; var types = pb.types; var arr = []; for (var i = 0; i < types.count; i++) { arr.push(types.objectAtIndex(i).js); } JSON.stringify(arr);'`,
        { encoding: 'utf8' }
    );
    console.log(`Types after write: ${typesAfter.trim()}`);

    console.log('\n═══ PROBE COMPLETE ═══');
})();
