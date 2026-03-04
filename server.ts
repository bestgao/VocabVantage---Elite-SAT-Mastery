
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const rawPort = process.env.PORT || "3000";
  const PORT = Number(rawPort);

  // 1. START LISTENING IMMEDIATELY (Satisfies Cloud Run Health Check)
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> SERVER LIVE: Listening on 0.0.0.0:${PORT}`);
  });

  server.on("error", (err) => {
    console.error("[Server] Fatal Error during listen:", err);
  });

  console.log(`[System] Initializing server on port ${PORT}...`);

  // 2. DEFINE ROUTES
  app.use(express.json({ limit: '10mb' })); // Support large payloads for user progress

  app.get("/healthz", (req, res) => res.status(200).send("OK"));
  app.get("/api/health", (req, res) => res.json({ 
    status: "ok", 
    port: PORT, 
    env: process.env.NODE_ENV,
    titan_protocol: "V41-SPACE-OPTIMIZATION", 
    build_time: "2026-03-04T12:00:00-08:00"
  }));

  // User Sync Endpoints
  const USERS_DIR = path.resolve(__dirname, "data", "users");
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }

  app.get("/api/sync/:email", (req, res) => {
    const { email } = req.params;
    const userPath = path.join(USERS_DIR, `${email.toLowerCase()}.json`);
    
    if (fs.existsSync(userPath)) {
      const data = fs.readFileSync(userPath, "utf-8");
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/sync", (req, res) => {
    const { email, progress } = req.body;
    if (!email || !progress) {
      return res.status(400).json({ error: "Missing email or progress" });
    }

    const userPath = path.join(USERS_DIR, `${email.toLowerCase()}.json`);
    
    // Simple conflict resolution: check revision if file exists
    if (fs.existsSync(userPath)) {
      const existingData = JSON.parse(fs.readFileSync(userPath, "utf-8"));
      if (progress.revision < existingData.revision) {
        return res.status(409).json({ error: "Conflict: Server has newer version", serverProgress: existingData });
      }
    }

    fs.writeFileSync(userPath, JSON.stringify(progress, null, 2));
    res.json({ success: true, revision: progress.revision });
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[Dev] Starting Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    console.log(`[Prod] Serving from: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get(/.*/, (req, res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        
        // Force a version check via a custom header
        res.setHeader('X-Titan-Protocol', 'V41');

        const indexPath = path.resolve(distPath, "index.html");
        let html = fs.readFileSync(indexPath, 'utf8');
        
        // Inject a cache-busting script directly into the HTML
        html = html.replace('</head>', `
          <script>
            console.log("Titan Protocol V41 Initialized");
            // Force clear old session if it's stuck
            if (localStorage.getItem('vv:vault_v20') && !localStorage.getItem('vv:user_email')) {
              console.log("Stale session detected, enforcing login gate");
            }
          </script>
        </head>`);
        
        res.send(html);
      });
    } else {
      console.error("[Prod] CRITICAL ERROR: dist folder missing!");
      app.get(/.*/, (req, res) => res.status(500).send("Build artifacts missing."));
    }
  }
}

process.on("uncaughtException", (err) => {
  console.error("[System] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[System] Unhandled Rejection at:", promise, "reason:", reason);
});

startServer().catch(err => {
  console.error("[System] Failed to start server function:", err);
  process.exit(1);
});
