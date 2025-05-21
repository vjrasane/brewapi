
import Database from "bun:sqlite";

export type Brew = {
    brew_id: number;
    created_at: string;
    updated_at: string;
    brew_name: string;
    og: number;
    sg: number;
}

export function createDb(dbPath: string) {
    const db = new Database(dbPath, { create: true, strict: true });
    db.run(
        `CREATE TABLE IF NOT EXISTS brew (
       brew_id INTEGER PRIMARY KEY AUTOINCREMENT, 
       created_at DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
       brew_name TEXT NOT NULL,
       og REAL NOT NULL,
       sg REAL NOT NULL
    )`
    )
    return db
}

function getLatestBrew(db: Database): Brew | null {
    return db.query<Brew, null>(`
        SELECT * FROM brew
        ORDER BY created_at DESC
        LIMIT 1
      `).get(null);
}

function insertBrew(db: Database, brewName: string, originalGravity: number): Brew {
    const result = db.query<Brew, [string, number, number]>(
        `INSERT INTO brew (brew_name, og, sg) VALUES (?, ?, ?) RETURNING *;`)
        .get(brewName, originalGravity, originalGravity);
    if (!result) throw new Error("Failed to insert brew");
    return result
}

function updateBrew(db: Database, brewId: number, currentGravity: number): Brew {
    const result = db.query<Brew, [number, string, number]>(
        `UPDATE brew SET sg = ?, updated_at = ? WHERE brew_id = ? RETURNING *;`)
        .get(currentGravity, new Date().toISOString(), brewId);
    if (!result) throw new Error("Failed to update brew");
    return result
}

export function upsertLatestBrew(db: Database, brewName: string, currentGravity: number, originalGravity: number = currentGravity, resetTreshold: number = 0.02): Brew {
    const latest = getLatestBrew(db);
    if (!latest) { return insertBrew(db, brewName, originalGravity); }
    if (currentGravity < latest.sg || Math.abs(currentGravity - latest.sg) < resetTreshold) {
        return updateBrew(db, latest.brew_id, currentGravity);
    }
    return insertBrew(db, brewName, originalGravity);
} 