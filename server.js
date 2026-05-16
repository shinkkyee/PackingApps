// server.ts
import express from "express";
import path2 from "path";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios2 from "axios";
import dotenv from "dotenv";

// src/routes/weatherRoutes.ts
import { Router } from "express";

// src/services/weatherService.ts
import axios from "axios";
var WeatherServiceError = class extends Error {
  constructor(message, status) {
    super(message);
    this.message = message;
    this.status = status;
    this.name = "WeatherServiceError";
  }
};
async function fetchWeather(city, lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  console.log(`Weather Request: City="${city}", Lat=${lat}, Lon=${lon}`);
  if (!apiKey) {
    throw new WeatherServiceError("OpenWeather API key is missing", 500);
  }
  try {
    const params = {
      appid: apiKey,
      units: "metric"
    };
    if (lat !== void 0 && lon !== void 0) {
      params.lat = lat;
      params.lon = lon;
    } else {
      params.q = city;
    }
    const response = await axios.get("https://api.openweathermap.org/data/2.5/forecast", { params });
    const data = response.data;
    const daysMap = /* @__PURE__ */ new Map();
    for (const item of data.list) {
      const [date, time] = item.dt_txt.split(" ");
      const hour = parseInt(time.split(":")[0], 10);
      if (!daysMap.has(date)) {
        daysMap.set(date, { date, morning: void 0, noon: void 0, night: void 0 });
      }
      const dayData = daysMap.get(date);
      const weatherId = item.weather[0]?.id;
      const hasRain = weatherId >= 200 && weatherId <= 531;
      const forecast = {
        temp: item.main.temp,
        condition: item.weather[0]?.main,
        hasRain,
        time
      };
      if (hour >= 6 && hour < 12) {
        if (!dayData.morning || Math.abs(hour - 9) < Math.abs(parseInt(dayData.morning.time.split(":")[0], 10) - 9)) {
          dayData.morning = forecast;
        }
      } else if (hour >= 12 && hour < 18) {
        if (!dayData.noon || Math.abs(hour - 15) < Math.abs(parseInt(dayData.noon.time.split(":")[0], 10) - 15)) {
          dayData.noon = forecast;
        }
      } else {
        if (!dayData.night || Math.abs(hour - 21) < Math.abs(parseInt(dayData.night.time.split(":")[0], 10) - 21)) {
          dayData.night = forecast;
        }
      }
    }
    const dailyForecasts = Array.from(daysMap.values()).filter(
      (day) => day.morning || day.noon || day.night
    );
    return {
      cityName: data.city.name,
      days: dailyForecasts
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new WeatherServiceError("City not found", 404);
      }
      if (!error.response) {
        throw new WeatherServiceError("Network failure", 502);
      }
      const message = error.response.data?.message || "Weather API error";
      throw new WeatherServiceError(message, error.response.status);
    }
    throw new WeatherServiceError("An unexpected error occurred", 500);
  }
}

// src/routes/weatherRoutes.ts
var router = Router();
router.get("/:city", async (req, res) => {
  const { city } = req.params;
  const { lat, lon } = req.query;
  try {
    const data = await fetchWeather(
      city,
      lat ? parseFloat(lat) : void 0,
      lon ? parseFloat(lon) : void 0
    );
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      res.status(error.status).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: "An unexpected error occurred" });
    }
  }
});
var weatherRoutes_default = router;

// src/db/daos.ts
import Database from "better-sqlite3";
var db = new Database("packing_pal.db");
var initializeDatabase = () => {
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
      lat REAL,
      lon REAL,
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
  try {
    db.exec("ALTER TABLE trips ADD COLUMN lat REAL");
  } catch (e) {
  }
  try {
    db.exec("ALTER TABLE trips ADD COLUMN lon REAL");
  } catch (e) {
  }
};
var UserDAO = {
  create: (email, passwordHash) => {
    return db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, passwordHash);
  },
  findByEmail: (email) => {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  },
  findById: (id) => {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }
};
var TripDAO = {
  create: (user_id, destination, start_date, end_date, trip_type, weather_summary, lat, lon) => {
    return db.prepare("INSERT INTO trips (user_id, destination, start_date, end_date, trip_type, weather_summary, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(user_id, destination, start_date, end_date, trip_type, weather_summary, lat || null, lon || null);
  },
  findAllByUserId: (user_id) => {
    return db.prepare("SELECT * FROM trips WHERE user_id = ? ORDER BY id DESC").all(user_id);
  },
  findById: (id, user_id) => {
    return db.prepare("SELECT * FROM trips WHERE id = ? AND user_id = ?").get(id, user_id);
  },
  delete: (id, user_id) => {
    return db.prepare("DELETE FROM trips WHERE id = ? AND user_id = ?").run(id, user_id);
  }
};
var ItemDAO = {
  createMany: (tripId, items) => {
    const stmt = db.prepare("INSERT INTO packing_items (trip_id, name, category) VALUES (?, ?, ?)");
    const transaction = db.transaction((items2) => {
      for (const item of items2) stmt.run(tripId, item.name, item.category);
    });
    transaction(items);
  },
  create: (tripId, name, category) => {
    return db.prepare("INSERT INTO packing_items (trip_id, name, category) VALUES (?, ?, ?)").run(tripId, name, category);
  },
  findAllByTripId: (tripId) => {
    return db.prepare("SELECT * FROM packing_items WHERE trip_id = ?").all(tripId);
  },
  updateStatus: (id, is_packed) => {
    return db.prepare("UPDATE packing_items SET is_packed = ? WHERE id = ?").run(is_packed, id);
  },
  delete: (id) => {
    return db.prepare("DELETE FROM packing_items WHERE id = ?").run(id);
  },
  deleteAllByTripId: (tripId) => {
    return db.prepare("DELETE FROM packing_items WHERE trip_id = ?").run(tripId);
  }
};

// vite.config.js
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true"
    }
  };
});

// server.ts
dotenv.config();
dotenv.config();
initializeDatabase();
var app = express();
var PORT = 3e3;
var JWT_SECRET = process.env.JWT_SECRET || "packing-pal-secret-key";
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${(/* @__PURE__ */ new Date()).toISOString()} - ${req.method} ${req.url}`);
  next();
});
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
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
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = UserDAO.findByEmail(email);
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});
app.use("/api/weather", weatherRoutes_default);
app.get("/api/geocode", async (req, res) => {
  const { q } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENWEATHER_API_KEY") {
    return res.status(500).json({ error: "OpenWeather API key is missing." });
  }
  try {
    const response = await axios2.get(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Geocoding service error";
    res.status(status).json({ error: `Geocoding Error (${status}): ${message}` });
  }
});
app.get("/api/trips", authenticateToken, (req, res) => {
  const trips = TripDAO.findAllByUserId(req.user.id);
  res.json(trips);
});
app.post("/api/trips", authenticateToken, (req, res) => {
  const { destination, start_date, end_date, trip_type, weather_summary, items, lat, lon } = req.body;
  const tripResult = TripDAO.create(req.user.id, destination, start_date, end_date, trip_type, weather_summary, lat, lon);
  const tripId = Number(tripResult.lastInsertRowid);
  if (items && Array.isArray(items)) {
    ItemDAO.createMany(tripId, items);
  }
  res.status(201).json({ id: tripId });
});
app.get("/api/trips/:id", authenticateToken, (req, res) => {
  const trip = TripDAO.findById(Number(req.params.id), req.user.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const items = ItemDAO.findAllByTripId(Number(req.params.id));
  res.json({ ...trip, items });
});
app.delete("/api/trips/:id", authenticateToken, (req, res) => {
  ItemDAO.deleteAllByTripId(Number(req.params.id));
  TripDAO.delete(Number(req.params.id), req.user.id);
  res.sendStatus(204);
});
app.patch("/api/items/:id", authenticateToken, (req, res) => {
  const { is_packed } = req.body;
  ItemDAO.updateStatus(Number(req.params.id), is_packed ? 1 : 0);
  res.sendStatus(200);
});
app.post("/api/trips/:id/items", authenticateToken, (req, res) => {
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
app.delete("/api/items/:id", authenticateToken, (req, res) => {
  ItemDAO.delete(Number(req.params.id));
  res.sendStatus(204);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const config = typeof vite_config_default === "function" ? await vite_config_default({ mode: "development", command: "serve" }) : vite_config_default;
    const vite = await createViteServer({
      ...config,
      server: { ...config.server, middlewareMode: true },
      appType: "spa",
      configFile: false
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
