---
name: clipboard-pipeline-forensics
description: Diagnostic skill to trace clipboard data through every stage of Quark's pipeline and identify where table structure is lost.
---

# Clipboard Pipeline Forensics Skill

## Purpose
When a user reports "pasting doesn't work" or "tables are jumbled", this skill provides a systematic protocol to identify the **exact stage** where data is corrupted.

## The 5-Stage Probe Protocol

### Stage 0: Raw OS Clipboard (Pre-Quark)
**Goal**: Confirm what the OS clipboard actually contains BEFORE Quark touches it.
**Tool**: Run `dump_clipboard.cjs` (see below) AFTER copying a table from Excel Online, but BEFORE Quark processes it (stop the daemon first).
**What to look for**:
- Does `public.html` contain a `<table>` tag?
- Does the plain text contain tab-separated values?
- If neither → the source app (Chrome/Excel Online) is the problem, not Quark.

### Stage 1: Quark Read (`clipboard.read()`)
**Goal**: Confirm what `clipboard.js:read()` returns.
**What to look for**:
- Does `html` field have content? If empty → the JXA read bridge is failing silently.
- Does `text` field have the raw cell values?

### Stage 2: Transformer Input
**Goal**: Confirm what arrives at `processClipboard(text, html)`.
**What to look for**:
- Is the `originalHtml` parameter populated?
- Which heuristic branch is triggered? (forensic preservation? TSV? CSV? markdown?)

### Stage 3: Transformer Output
**Goal**: Confirm what `processClipboard` returns.
**What to look for**:
- `result.changed` — is it true or false?
- `result.html` — does it contain styled `<table>` tags?
- `result.markdown` — is it a valid markdown table?
- `result.skipReason` — was it skipped? Why?

### Stage 4: Clipboard Write (`clipboard.writeHtml()`)
**Goal**: Confirm what actually gets written back to the OS clipboard.
**What to look for**:
- After `writeHtml()`, read the clipboard again. Does it contain both `public.html` and `public.utf8-plain-text`?
- Does the HTML match what was written?

### Stage 5: Target App Read
**Goal**: Confirm what the target app (Teams) actually reads from the clipboard.
**What to look for**:
- Paste into Teams/Notion/Pages and observe the result.
- If Stage 4 is correct but Stage 5 fails → the target app is rejecting Quark's HTML format.

## Diagnostic Script
Create and run `/tmp/quark_probe.cjs` (defined separately) to automate Stages 0-4.

## Common Root Causes
1. **JXA read returns empty HTML** → `osascript -l JavaScript` silently fails on some macOS versions
2. **Heuristic skips the content** → `processClipboard` returns `changed: false`
3. **writeHtml crashes silently** → the `execSync` call errors but is caught by the empty `catch(e){}`
4. **Target app ignores `public.html`** → Some apps only read `text/html` or `«class HTML»`, not `public.html`
5. **Escaping breaks the HTML** → The string escaping in `writeHtml` corrupts special characters
