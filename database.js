import * as SQLite from "expo-sqlite";

// Abre (ou cria, na primeira execução) o banco local e garante que a tabela exista.
// A promise fica em cache para que o banco seja aberto apenas uma vez.
let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("mylocation.db");
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

// Insere uma nova localização e retorna o registro gravado.
export async function insertLocation(latitude, longitude) {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO locations (latitude, longitude) VALUES (?, ?)",
    latitude,
    longitude
  );
  return db.getFirstAsync(
    "SELECT * FROM locations WHERE id = ?",
    result.lastInsertRowId
  );
}

// Retorna todas as localizações salvas, da mais recente para a mais antiga.
export async function getLocations() {
  const db = await getDb();
  return db.getAllAsync("SELECT * FROM locations ORDER BY id DESC");
}
