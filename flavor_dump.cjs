const { execSync } = require('child_process');

console.log('🔍 Quark Deep OS Internals: Flavor Dump');
console.log('------------------------------------------');

try {
    console.log('Fetching clipboard info via AppleScript...');
    const info = execSync(`osascript -e 'clipboard info'`, { encoding: 'utf8' });
    console.log('\n[RAW CLIPBOARD INFO]');
    console.log(info);

    // Attempt to extract the custom chromium data
    console.log('\n[ATTEMPTING TO EXTRACT CUSTOM DATA TYPES]');
    const classes = info.match(/[a-zA-Z.]+?, \d+/g);
    if (classes) {
        for (const cls of classes) {
            const type = cls.split(',')[0].trim();
            if (type.includes('html') || type.includes('HTML') || type.includes('web')) {
                console.log(`\n--- DUMPING FLAVOR: ${type} ---`);
                try {
                    const hex = execSync(`osascript -e 'the clipboard as "${type}"' 2>/dev/null`, { encoding: 'utf8' });
                    if (hex.includes('«data')) {
                        const hexMatch = hex.match(/«data [a-zA-Z]+([0-9A-F]+)»/i);
                        if (hexMatch) {
                            const buf = Buffer.from(hexMatch[1], 'hex');
                            console.log(buf.toString('utf8').substring(0, 500));
                        } else {
                            console.log('Hex match failed. Raw:', hex);
                        }
                    } else {
                        console.log(hex);
                    }
                } catch (e) {
                    console.log(`Failed to extract ${type}`);
                }
            }
        }
    }

} catch (e) {
    console.log('Error executing osascript', e.message);
}

console.log('\n✅ Dump complete. Please share this output.');
