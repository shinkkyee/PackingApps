import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("packing_pal.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    destination TEXT,
    start_date TEXT,
    end_date TEXT,
    trip_type TEXT,
    weather_summary TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS packing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER,
    name TEXT,
    category TEXT,
    is_packed INTEGER DEFAULT 0,
    FOREIGN KEY(trip_id) REFERENCES trips(id)
  );
`);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "packing-pal-secret-key";

app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Register
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  
  // Password validation
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;
  
  if (!hasUppercase || !hasLowercase || !hasSymbol || !isLongEnough) {
    return res.status(400).json({ 
      error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one symbol." 
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    const result = stmt.run(email, hashedPassword);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Get Weather
app.get("/api/weather", async (req, res) => {
  const { q } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENWEATHER_API_KEY") {
    return res.status(500).json({ error: "OpenWeather API key is missing. Please add OPENWEATHER_API_KEY to the Secrets panel." });
  }

  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q as string)}&appid=${apiKey}&units=metric`);
    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Weather service error";
    res.status(status).json({ error: `Weather API Error (${status}): ${message}` });
  }
});

// Geocoding for suggestions
app.get("/api/geocode", async (req, res) => {
  const { q } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENWEATHER_API_KEY") {
    return res.status(500).json({ error: "OpenWeather API key is missing." });
  }

  try {
    const response = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q as string)}&limit=5&appid=${apiKey}`);
    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Geocoding service error";
    res.status(status).json({ error: `Geocoding Error (${status}): ${message}` });
  }
});

// Trips
app.get("/api/trips", authenticateToken, (req: any, res) => {
  const trips = db.prepare("SELECT * FROM trips WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
  res.json(trips);
});

app.post("/api/trips", authenticateToken, (req: any, res) => {
  const { destination, start_date, end_date, trip_type, weather_summary, items } = req.body;
  
  const tripStmt = db.prepare("INSERT INTO trips (user_id, destination, start_date, end_date, trip_type, weather_summary) VALUES (?, ?, ?, ?, ?, ?)");
  const tripResult = tripStmt.run(req.user.id, destination, start_date, end_date, trip_type, weather_summary);
  const tripId = tripResult.lastInsertRowid;

  if (items && Array.isArray(items)) {
    const itemStmt = db.prepare("INSERT INTO packing_items (trip_id, name, category) VALUES (?, ?, ?)");
    const insertMany = db.transaction((items) => {
      for (const item of items) itemStmt.run(tripId, item.name, item.category);
    });
    insertMany(items);
  }

  res.status(201).json({ id: tripId });
});

app.get("/api/trips/:id", authenticateToken, (req: any, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const items = db.prepare("SELECT * FROM packing_items WHERE trip_id = ?").all(req.params.id);
  res.json({ ...trip, items });
});

app.delete("/api/trips/:id", authenticateToken, (req: any, res) => {
  db.prepare("DELETE FROM packing_items WHERE trip_id = ?").run(req.params.id);
  db.prepare("DELETE FROM trips WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// Packing Items
app.patch("/api/items/:id", authenticateToken, (req: any, res) => {
  const { is_packed } = req.body;
  db.prepare("UPDATE packing_items SET is_packed = ? WHERE id = ?").run(is_packed ? 1 : 0, req.params.id);
  res.sendStatus(200);
});

app.post("/api/trips/:id/items", authenticateToken, (req: any, res) => {
  const { name, category } = req.body;
  const result = db.prepare("INSERT INTO packing_items (trip_id, name, category) VALUES (?, ?, ?)").run(req.params.id, name, category);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.delete("/api/items/:id", authenticateToken, (req: any, res) => {
  db.prepare("DELETE FROM packing_items WHERE id = ?").run(req.params.id);
  res.sendStatus(204);
});

// --- Vite Integration ---

async function startServer() {
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
