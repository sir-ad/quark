const { marked } = require('marked');

function analyzeGridProperties(text, delimiter) {
  const lines = text.split('\n').map(l => l.trim('\r'));
  if (lines.length < 2) return { isGrid: false };

  const rows = lines.map(l => l.split(delimiter));
  const counts = rows.map(r => r.length);

  // A perfect grid has all rows equal length
  const maxCols = Math.max(...counts);
  const minCols = Math.min(...counts);

  // Mathematical sparse matrix inference: 
  // If the delimiter appears consistently across multiple lines, it's a grid.
  // For TSV, even a single tab in multiple lines strongly implies a spreadsheet payload.
  let isGrid = false;
  if (delimiter === '\t') {
    const linesWithTabs = lines.filter(l => l.includes('\t')).length;
    // If at least 50% of lines have tabs, or we have distinct multi-column structure
    isGrid = (linesWithTabs > 0 && linesWithTabs >= (lines.length / 2)) || (maxCols > 1 && counts[0] === counts[1]);
  } else {
    isGrid = maxCols > 2 && minCols === maxCols;
  }

  return { isGrid, rows, cols: maxCols };
}

function isExcelTSV(text) {
  return analyzeGridProperties(text, '\t').isGrid;
}

function convertToHTML(text, delimiter) {
  const { rows, cols } = analyzeGridProperties(text, delimiter);
  let html = '<table style="border-collapse: collapse; font-family: sans-serif; font-size: 14px;">\n';
  rows.forEach((row, i) => {
    // Drop completely empty trailing rows
    if (i === rows.length - 1 && row.join('').trim() === '') return;

    html += '  <tr>\n';

    // Pad sparse rows with empty cells to maintain grid geometry
    for (let j = 0; j < cols; j++) {
      const cell = row[j] || '';
      const tag = i === 0 ? 'th' : 'td';
      const bg = i === 0 ? 'background-color: #f3f2f1;' : '';
      const style = `border: 1px solid #d1d1d1; padding: 6px 12px; ${bg}`;
      html += `    <${tag} style="${style}">${cell.trim()}</${tag}>\n`;
    }

    html += '  </tr>\n';
  });
  html += '</table>';
  return html;
}

function stripTrackingParams(url) {
  try {
    const parsed = new URL(url);
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'si', 'igshid'];
    let changed = false;
    paramsToRemove.forEach(param => {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.delete(param);
        changed = true;
      }
    });
    return changed ? parsed.toString() : url;
  } catch (e) {
    return url;
  }
}

function fixPDFLineBreaks(text) {
  return text.replace(/([^\n])\n([^\n])/g, '$1 $2');
}

function prettifyJSON(text) {
  try {
    const obj = JSON.parse(text);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return text;
  }
}

function applySmartQuotes(text) {
  // Detect language based on character frequency
  const frenchChars = (text.match(/[éèêëàâäôöûüçœ]/gi) || []).length;
  const germanChars = (text.match(/[äöüß]/gi) || []).length;
  const spanishChars = (text.match(/[ñáéíóú¿¡]/gi) || []).length;

  // If French is dominant
  if (frenchChars > 0 && frenchChars >= germanChars && frenchChars >= spanishChars) {
    return text
      .replace(/(^|\s)"(.*?)"(?=\s|$|[.,!?])/g, "$1« $2 »")
      .replace(/(^|\s)'(.*?)'(?=\s|$|[.,!?])/g, "$1‹ $2 ›")
      .replace(/--/g, "\u2014");
  }
  // If German is dominant
  else if (germanChars > 0 && germanChars > frenchChars && germanChars >= spanishChars) {
    return text
      .replace(/(^|\s)"(.*?)"(?=\s|$|[.,!?])/g, "$1„$2“")
      .replace(/(^|\s)'(.*?)'(?=\s|$|[.,!?])/g, "$1‚$2‘")
      .replace(/--/g, "\u2014");
  }
  // If Spanish is dominant
  else if (spanishChars > 0 && spanishChars > frenchChars && spanishChars > germanChars) {
    return text
      .replace(/(^|\s)"(.*?)"(?=\s|$|[.,!?])/g, "$1«$2»")
      .replace(/(^|[-\u2014\s(\["])'/g, "$1\u2018")
      .replace(/'/g, "\u2019")
      .replace(/--/g, "\u2014");
  }
  // Default English
  else {
    return text
      .replace(/(^|[-\u2014\s(\["])'/g, "$1\u2018")
      .replace(/'/g, "\u2019")
      .replace(/(^|[-\u2014/\[(\u2018\s])"/g, "$1\u201c")
      .replace(/"/g, "\u201d")
      .replace(/--/g, "\u2014");
  }
}

function renderMathFormulas(text) {
  let html = text;
  const blockMathRegex = /\$\$\s*([\s\S]*?)\s*\$\$/g;
  const inlineMathRegex = /\$(?!\s)([^$\n]+?)(?<!\s)\$/g;

  let hasMath = false;

  html = html.replace(blockMathRegex, (match, formula) => {
    hasMath = true;
    const encoded = encodeURIComponent(formula.trim());
    return `<div style="text-align: center; margin: 1em 0;"><img src="https://latex.codecogs.com/svg.image?${encoded}" alt="${formula.replace(/"/g, '&quot;')}" /></div>`;
  });

  html = html.replace(inlineMathRegex, (match, formula) => {
    hasMath = true;
    const encoded = encodeURIComponent(formula.trim());
    return `<img style="vertical-align: middle;" src="https://latex.codecogs.com/svg.image?${encoded}" alt="${formula.replace(/"/g, '&quot;')}" />`;
  });

  return { hasMath, html };
}

function isMarkdown(text) {
  // Simple heuristic: contains headings, lists, bold, links, or tables
  return /^#+\s/m.test(text) ||
    /\*\*[^*]+\*\*/.test(text) ||
    /\[.+?\]\(.+?\)/.test(text) ||
    /^\s*[-*+]\s/m.test(text) ||
    /^\s*\d+\.\s/m.test(text) ||
    /`[^`]+`/.test(text) ||
    /^> /m.test(text) ||
    (text.includes('|') && /^[-:| ]+$/m.test(text));
}

async function convertMarkdownToHTML(text) {
  // First render math
  const { html: mathProcessed } = renderMathFormulas(text);
  // Then parse markdown
  const html = await marked.parse(mathProcessed);
  // Add some basic styling to tables and code blocks for clipboard pasting
  return html
    .replace(/<table>/g, '<table style="border-collapse: collapse; font-family: sans-serif; font-size: 14px; width: 100%;">')
    .replace(/<th>/g, '<th style="border: 1px solid #d1d1d1; padding: 6px 12px; background-color: #f3f2f1; text-align: left;">')
    .replace(/<td>/g, '<td style="border: 1px solid #d1d1d1; padding: 6px 12px;">')
    .replace(/<code>/g, '<code style="background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; font-family: monospace;">')
    .replace(/<pre><code.*?>/g, '<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 8px; font-family: monospace; overflow-x: auto;"><code>');
}

function normalizeShouting(text) {
  if (/^[A-Z\s.,!?'-]+$/.test(text) && text.length > 15 && text.includes(' ')) {
    return text.charAt(0) + text.slice(1).toLowerCase();
  }
  return text;
}

// The master pipeline
async function processClipboard(text, originalHtml) {
  let result = { changed: false, text: text, html: originalHtml };

  // PRESERVATION HEURISTIC: Yield if high-quality HTML already exists
  if (originalHtml) {
    const forensicMarkers = [
      'data-sheets-value',
      'data-sheets-userformat',
      'br-re-calc',
      'x-office-spreadsheet',
      '<table',
      '<tbody',
      '<thead'
    ];

    const hasStructure = forensicMarkers.some(marker => originalHtml.toLowerCase().includes(marker));
    if (hasStructure) {
      return { changed: false, text: text, html: originalHtml, skipReason: 'Forensic structure detected' };
    }
  }

  // 0. Case Normalization (Shouting)
  const normalizedText = normalizeShouting(text);
  if (normalizedText !== text) {
    text = normalizedText;
    result.text = text;
    result.changed = true;
  }

  // 0.5 Smart Quotes
  if (text.includes('"') || text.includes("'")) {
    if (!text.startsWith('{') && !text.startsWith('[') && !text.includes('function') && !text.includes('const ')) {
      const smartText = applySmartQuotes(text);
      if (smartText !== text) {
        text = smartText;
        result.text = text;
        result.changed = true;
      }
    }
  }

  // 1. URL Tracking Stripper
  if (text.startsWith('http') && text.includes('utm_')) {
    const clean = stripTrackingParams(text);
    if (clean !== text) return { changed: true, text: clean, html: null };
  }

  // 2. JSON Prettier
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    const pretty = prettifyJSON(text);
    if (pretty !== text && pretty.includes('\n')) return { changed: true, text: pretty, html: null };
  }

  // 3. Excel TSV to HTML
  if (isExcelTSV(text)) {
    return { changed: true, text: text, html: convertToHTML(text, '\t') };
  }

  // 4. CSV to HTML
  if (!originalHtml && analyzeGridProperties(text, ',').isGrid) {
    return { changed: true, text: text, html: convertToHTML(text, ',') };
  }

  // 5. Full Markdown & Math to HTML
  const mathResult = renderMathFormulas(text);
  if ((isMarkdown(text) || mathResult.hasMath) && !originalHtml) {
    const html = await convertMarkdownToHTML(text);
    return { changed: true, text: text, html: html };
  }

  // 6. PDF Line Breaks (Only apply if it looks like a broken paragraph, heuristic)
  if (text.length > 100 && text.split('\n').length > 3 && !text.includes('\t') && !originalHtml) {
    const fixed = fixPDFLineBreaks(text);
    if (fixed !== text && fixed.length < text.length) {
      return { changed: true, text: fixed, html: null };
    }
  }

  return result;
}

module.exports = { processClipboard };
