const transformers = require('./cli/src/transformers');

async function testV130() {
    console.log('🧪 Starting v1.3.0 QA Simulation...');

    // Case 1: Complex Table to Markdown
    const htmlTable = `
    <table>
      <tr><th>Item</th><th>Price</th></tr>
      <tr><td>Apple</td><td>$1</td></tr>
      <tr><td>Banana</td><td>$2</td></tr>
    </table>
  `;

    const result1 = await transformers.processClipboard('table text', htmlTable);
    console.log('\n--- Case 1: HTML Table to Markdown ---');
    console.log('HTML Detected:', !!result1.html);
    console.log('Markdown Result:\n', result1.markdown);

    if (result1.markdown.includes('| Item | Price |') && result1.markdown.includes('| --- | --- |')) {
        console.log('✅ Table Markdown transformation successful!');
    } else {
        console.error('❌ Table Markdown transformation FAILED');
    }

    // Case 2: Deep Mixed Content
    const mixedHtml = `
    <h1>Title</h1>
    <p>This is a <b>bold</b> paragraph with a <a href="https://example.com">link</a>.</p>
    <ul>
      <li>Point 1</li>
      <li>Point 2</li>
    </ul>
  `;
    const result2 = await transformers.processClipboard('placeholder', mixedHtml);
    console.log('\n--- Case 2: Mixed Content to Markdown ---');
    console.log('Markdown Result:\n', result2.markdown);

    if (result2.markdown.includes('# Title') && result2.markdown.includes('**bold**') && result2.markdown.includes('[link](https://example.com)')) {
        console.log('✅ Semantic Markdown transformation successful!');
    } else {
        console.error('❌ Semantic Markdown transformation FAILED');
    }

    // Case 3: JSON Code Block
    const jsonText = '{"status": "ok", "version": "1.3.0"}';
    const result3 = await transformers.processClipboard(jsonText, null);
    console.log('\n--- Case 3: JSON to Markdown Block ---');
    console.log('Markdown Result:\n', result3.markdown);

    if (result3.markdown.includes('```json')) {
        console.log('✅ JSON Code Block successful!');
    } else {
        console.error('❌ JSON Code Block FAILED');
    }

    process.exit(0);
}

testV130().catch(e => {
    console.error(e);
    process.exit(1);
});
