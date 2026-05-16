import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
import weatherRouter from "./src/routes/weatherRoutes";

dotenv.config();

import { UserDAO, TripDAO, ItemDAO, initializeDatabase } from "./src/db/daos";

dotenv.config();

// Initialize Database (Member 2 Responsibility)
initializeDatabase();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "packing-pal-secret-key";

app.use(express.json());

// Member 2: Debug Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
    const result = UserDAO.create(email, hashedPassword);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = UserDAO.findByEmail(email);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Weather Route Module
app.use("/api/weather", weatherRouter);

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
  const trips = TripDAO.findAllByUserId(req.user.id);
  res.json(trips);
});

app.post("/api/trips", authenticateToken, (req: any, res) => {
  const { destination, start_date, end_date, trip_type, weather_summary, items, lat, lon } = req.body;
  
  const tripResult = TripDAO.create(req.user.id, destination, start_date, end_date, trip_type, weather_summary, lat, lon);
  const tripId = Number(tripResult.lastInsertRowid);

  if (items && Array.isArray(items)) {
    ItemDAO.createMany(tripId, items);
  }

  res.status(201).json({ id: tripId });
});

app.get("/api/trips/:id", authenticateToken, (req: any, res) => {
  const trip = TripDAO.findById(Number(req.params.id), req.user.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const items = ItemDAO.findAllByTripId(Number(req.params.id));
  res.json({ ...trip, items });
});

app.delete("/api/trips/:id", authenticateToken, (req: any, res) => {
  ItemDAO.deleteAllByTripId(Number(req.params.id));
  TripDAO.delete(Number(req.params.id), req.user.id);
  res.sendStatus(204);
});

// Packing Items
app.patch("/api/items/:id", authenticateToken, (req: any, res) => {
  const { is_packed } = req.body;
  ItemDAO.updateStatus(Number(req.params.id), is_packed ? 1 : 0);
  res.sendStatus(200);
});

app.post("/api/trips/:id/items", authenticateToken, (req: any, res) => {
  const { name, category } = req.body;
  const result = ItemDAO.create(Number(req.params.id), name, category);
  const newItem = {
    id: result.lastInsertRowid,
    trip_id: Number(req.params.id),
    name,
    category,
    is_packed: 0
  };
  res.status(201).json(newItem);
});

app.delete("/api/items/:id", authenticateToken, (req: any, res) => {
  ItemDAO.delete(Number(req.params.id));
  res.sendStatus(204);
});

// --- Vite Integration ---

import viteConfig from './vite.config.js';

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const config = typeof viteConfig === 'function' ? await viteConfig({ mode: 'development', command: 'serve' }) : viteConfig;
    const vite = await createViteServer({
      ...config,
      server: { ...config.server, middlewareMode: true },
      appType: "spa",
      configFile: false,
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
