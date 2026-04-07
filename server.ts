import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy to bypass CORS and handle timeouts
  app.get("/api/congress/legislators", async (req, res) => {
    console.log(`[API] Received request for legislators from ${req.ip}`);
    
    const SOURCES = [
      'https://unitedstates.github.io/congress-legislators/legislators-current.json',
      'https://raw.githubusercontent.com/unitedstates/congress-legislators/master/legislators-current.json',
      'https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json'
    ];

    for (const url of SOURCES) {
      try {
        console.log(`[API] Attempting to fetch from: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[API] Source ${url} returned status ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`[API] Successfully fetched data from: ${url}`);
        return res.json(data);
      } catch (error) {
        console.error(`[API] Error fetching from ${url}:`, error);
      }
    }

    // Last resort: Return a small subset of mock data if all sources fail
    // This prevents the app from being completely broken during network issues
    console.warn("[API] All external sources failed. Returning emergency fallback data.");
    const fallbackData = [
      {
        id: { bioguide: 'M000355' },
        name: { first: 'Mitch', last: 'McConnell', official_full: 'Mitch McConnell' },
        bio: { birthday: '1942-02-20', gender: 'M' },
        terms: [{ type: 'sen', start: '1985-01-03', end: '2027-01-03', state: 'KY', party: 'Republican' }]
      },
      {
        id: { bioguide: 'S000148' },
        name: { first: 'Chuck', last: 'Schumer', official_full: 'Charles E. Schumer' },
        bio: { birthday: '1950-11-23', gender: 'M' },
        terms: [{ type: 'sen', start: '1999-01-03', end: '2029-01-03', state: 'NY', party: 'Democrat' }]
      },
      {
        id: { bioguide: 'P000197' },
        name: { first: 'Nancy', last: 'Pelosi', official_full: 'Nancy Pelosi' },
        bio: { birthday: '1940-03-26', gender: 'F' },
        terms: [{ type: 'rep', start: '1987-06-02', end: '2025-01-03', state: 'CA', district: 11, party: 'Democrat' }]
      }
    ];
    
    res.json(fallbackData);
  });

  // Prevent API calls from falling through to SPA fallback
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
