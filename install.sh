#!/usr/bin/env sh
# Quark one-click installer for macOS and Linux
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo ""
echo "${BOLD}      o-------o${RESET}"
echo "${BOLD}      | \\   / |${RESET}"
echo "${BOLD}      |   o   |${RESET}"
echo "${BOLD}      | /   \\ |${RESET}"
echo "${BOLD}      o-------o${RESET}"
echo ""
echo "${BOLD}  Quark — AI-Native Clipboard Daemon${RESET}"
echo ""

# ── 1. Check Node.js ────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  echo "${RED}Error:${RESET} Node.js is not installed."
  echo "  Install it from https://nodejs.org (v18 or later required)"
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "${RED}Error:${RESET} Node.js 18+ is required. Found: $(node --version)"
  echo "  Upgrade at https://nodejs.org"
  exit 1
fi
echo "${GREEN}✓${RESET} Node.js $(node --version) detected"

# ── 2. Check npm ─────────────────────────────────────────────────────────────
if ! command -v npm >/dev/null 2>&1; then
  echo "${RED}Error:${RESET} npm is not installed (it usually ships with Node.js)."
  exit 1
fi

# ── 3. Install globally ──────────────────────────────────────────────────────
echo ""
echo "Installing @quark.clip/quark globally..."
npm install -g @quark.clip/quark

# ── 4. Register as OS service ────────────────────────────────────────────────
echo ""
echo "Registering Quark as an OS background service..."
quark install

echo ""
echo "${GREEN}${BOLD}Done!${RESET} Quark is running in the background."
echo ""
echo "  ${BOLD}quark status${RESET}   — check daemon health"
echo "  ${BOLD}quark logs${RESET}     — tail live logs"
echo "  ${BOLD}quark mcp${RESET}      — start MCP server for Claude / Cursor"
echo "  ${BOLD}quark uninstall${RESET} — remove the OS service"
echo ""
