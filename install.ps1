# Quark one-click installer for Windows (PowerShell)
# Run with: iex (irm https://raw.githubusercontent.com/sir-ad/quark/main/install.ps1)

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "      o-------o" -ForegroundColor Cyan
Write-Host "      | \   / |" -ForegroundColor Cyan
Write-Host "      |   o   |" -ForegroundColor Cyan
Write-Host "      | /   \ |" -ForegroundColor Cyan
Write-Host "      o-------o" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Quark - AI-Native Clipboard Daemon" -ForegroundColor White
Write-Host ""

# ── 1. Check Node.js ──────────────────────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed." -ForegroundColor Red
    Write-Host "  Install it from https://nodejs.org (v18 or later required)"
    exit 1
}

$nodeVersion = node -e "process.stdout.write(process.versions.node)"
$nodeMajor   = [int]($nodeVersion -split '\.')[0]
if ($nodeMajor -lt 18) {
    Write-Host "Error: Node.js 18+ is required. Found: v$nodeVersion" -ForegroundColor Red
    Write-Host "  Upgrade at https://nodejs.org"
    exit 1
}
Write-Host "v  Node.js v$nodeVersion detected" -ForegroundColor Green

# ── 2. Install globally ───────────────────────────────────────────────────
Write-Host ""
Write-Host "Installing @quark.clip/quark globally..."
npm install -g @quark.clip/quark

# ── 3. Register as OS service ─────────────────────────────────────────────
Write-Host ""
Write-Host "Registering Quark as an OS background service..."
quark install

Write-Host ""
Write-Host "Done! Quark is running in the background." -ForegroundColor Green
Write-Host ""
Write-Host "  quark status    - check daemon health"
Write-Host "  quark logs      - tail live logs"
Write-Host "  quark mcp       - start MCP server for Claude / Cursor"
Write-Host "  quark uninstall - remove the OS service"
Write-Host ""
