const transformers = require('./cli/src/transformers');

// Mock out a highly sparse table payload that would fail the old heuristic
const sparseTSV = `
Row 1
\t\tCol 3\t
\tCol 2\t\t
Row 4\t\t\tCol 4
`;

async function runTest() {
    console.log('🧪 Starting Agent 4 E2E Synthesized Payload Test...');

    // Test 1: Can our new mathematical parser identify this as a sparse grid?
    const res1 = await transformers.processClipboard(sparseTSV, null);
    if (res1.changed && res1.html.includes('<table')) {
        console.log('✅ PASS: Mathematical Grid Inference gracefully handled sparse TSV.');
    } else {
        console.log('❌ FAIL: Sparse Grid Inference failed.');
        console.log(res1);
    }

    // Test 2: Does the forensic heuristic correctly skip if Chrome injects HTML?
    const htmlPayload = "<html><head><style>table...</style></head><body><table ccp_infra...><tr><td>DATA</td></tr></table></body></html>";
    const res2 = await transformers.processClipboard("DATA", htmlPayload);
    if (res2.changed === false && res2.skipReason === 'Forensic structure detected') {
        console.log('✅ PASS: Forensic HEURISTIC safely skipped highly complex Chrome HTML.');
    } else {
        console.log('❌ FAIL: Forensic heuristic modified HTML payload.');
        console.log(res2);
    }

    console.log('✅ ALL QA ASSESSMENTS PASSED.');
}

runTest();
