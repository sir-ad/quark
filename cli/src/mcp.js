const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const http = require('http');

// This script is executed by LLMs (Claude Desktop, Cursor) via `quark mcp`
// It communicates with the background Quark daemon via local HTTP.

const API_PORT = 14314;

async function getClipboardFromDaemon() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${API_PORT}/clipboard`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).text); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function setClipboardToDaemon(text) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://127.0.0.1:${API_PORT}/clipboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(JSON.stringify({ text }));
    req.end();
  });
}

async function runMCPServer() {
  const server = new Server(
    { name: "quark-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_clipboard",
        description: "Read the user's current operating system clipboard.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "set_clipboard",
        description: "Write text directly to the user's operating system clipboard.",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "The text to place on the clipboard" }
          },
          required: ["text"]
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (request.params.name === "get_clipboard") {
        const text = await getClipboardFromDaemon();
        return { content: [{ type: "text", text: text || "(Clipboard is empty)" }] };
      }
      
      if (request.params.name === "set_clipboard") {
        await setClipboardToDaemon(request.params.arguments.text);
        return { content: [{ type: "text", text: "Successfully updated clipboard." }] };
      }
      
      throw new Error("Unknown tool");
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}. Is the Quark daemon running? (Run 'quark start')` }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runMCPServer().catch(console.error);
