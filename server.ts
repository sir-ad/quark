import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse raw text bodies (TSV)
  app.use(express.text({ type: "*/*", limit: "10mb" }));

  // API Endpoint for cURL / Terminal users
  app.post("/api/convert", (req, res) => {
    const tsv = req.body;
    
    if (!tsv || typeof tsv !== "string") {
      return res.status(400).send("Missing or invalid TSV data");
    }

    // Parse TSV
    const rows = tsv.trim().split("\n").map((row) => row.split("\t"));
    
    if (rows.length === 0 || rows[0].length === 0) {
      return res.status(400).send("No valid tabular data found");
    }

    // Generate Teams-friendly HTML
    let html = '<table style="border-collapse: collapse; font-family: sans-serif; font-size: 14px;">\n';
    
    rows.forEach((row, i) => {
      html += "  <tr>\n";
      row.forEach((cell) => {
        const tag = i === 0 ? "th" : "td";
        const bg = i === 0 ? "background-color: #f3f2f1;" : "";
        const style = `border: 1px solid #d1d1d1; padding: 6px 12px; ${bg}`;
        html += `    <${tag} style="${style}">${cell.trim()}</${tag}>\n`;
      });
      html += "  </tr>\n";
    });
    
    html += "</table>";

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  // Vite middleware for development (serves the React frontend)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
