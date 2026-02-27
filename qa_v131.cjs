const transformers = require('./cli/src/transformers');

async function testV131() {
    console.log('🧪 Starting v1.3.1 QA Simulation...');

    // Case: Raw Table re-styling
    const rawTable = `
    <table class="xl65">
      <tr><td>Test Item</td><td>$100</td></tr>
    </table>
  `;

    const result = await transformers.processClipboard('table text', rawTable);
    console.log('\n--- Case: Table Stylation ---');
    console.log('Changed:', result.changed);
    console.log('HTML Output contains border style:', result.html.includes('border: 1px solid #d1d1d1'));

    if (result.changed && result.html.includes('border: 1px solid #d1d1d1')) {
        console.log('✅ Table re-styling successful!');
    } else {
        console.error('❌ Table re-styling FAILED');
        process.exit(1);
    }

    process.exit(0);
}

testV131().catch(e => {
    console.error(e);
    process.exit(1);
});
