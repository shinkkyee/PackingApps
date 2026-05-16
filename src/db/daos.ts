import Database from "better-sqlite3";

const db = new Database("packing_pal.db");

/**
 * Member 2 - Entities & Schema
 */
export const initializeDatabase = () => {
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

  // Migration: Add lat/lon if they don't exist
  try {
    db.exec("ALTER TABLE trips ADD COLUMN lat REAL");
  } catch (e) { /* Already exists */ }
  try {
    db.exec("ALTER TABLE trips ADD COLUMN lon REAL");
  } catch (e) { /* Already exists */ }
};

/**
 * Member 2 - DAO (Data Access Objects)
 * Responsibilities: Insert, Update, Delete, Query
 */

export const UserDAO = {
  create: (email: string, passwordHash: string) => {
    return db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, passwordHash);
  },
  findByEmail: (email: string) => {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  },
  findById: (id: number) => {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }
};

export const TripDAO = {
  create: (user_id: number, destination: string, start_date: string, end_date: string, trip_type: string, weather_summary: string, lat?: number, lon?: number) => {
    return db.prepare("INSERT INTO trips (user_id, destination, start_date, end_date, trip_type, weather_summary, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(user_id, destination, start_date, end_date, trip_type, weather_summary, lat || null, lon || null);
  },
  findAllByUserId: (user_id: number) => {
    return db.prepare("SELECT * FROM trips WHERE user_id = ? ORDER BY id DESC").all(user_id);
  },
  findById: (id: number, user_id: number) => {
    return db.prepare("SELECT * FROM trips WHERE id = ? AND user_id = ?").get(id, user_id);
  },
  delete: (id: number, user_id: number) => {
    return db.prepare("DELETE FROM trips WHERE id = ? AND user_id = ?").run(id, user_id);
  }
};

export const ItemDAO = {
  createMany: (tripId: number, items: any[]) => {
    const stmt = db.prepare("INSERT INTO packing_items (trip_id, name, category) VALUES (?, ?, ?)");
    const transaction = db.transaction((items) => {
      for (const item of items) stmt.run(tripId, item.name, item.category);
    });
    transaction(items);
  },
  create: (tripId: number, name: string, category: string) => {
    return db.prepare("INSERT INTO packing_items (trip_id, name, category) VALUES (?, ?, ?)").run(tripId, name, category);
  },
  findAllByTripId: (tripId: number) => {
    return db.prepare("SELECT * FROM packing_items WHERE trip_id = ?").all(tripId);
  },
  updateStatus: (id: number, is_packed: number) => {
    return db.prepare("UPDATE packing_items SET is_packed = ? WHERE id = ?").run(is_packed, id);
  },
  delete: (id: number) => {
    return db.prepare("DELETE FROM packing_items WHERE id = ?").run(id);
  },
  deleteAllByTripId: (tripId: number) => {
    return db.prepare("DELETE FROM packing_items WHERE trip_id = ?").run(tripId);
  }
};

export default db;
