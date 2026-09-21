// Adaptador que expoe a API do SQLiteDatabase do expo-sqlite sobre o node:sqlite.
// O SQL executado e exatamente o mesmo que roda no aparelho.
import { DatabaseSync } from 'node:sqlite';

export class SQLiteDatabase {
  constructor(private readonly db: DatabaseSync) {}

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }
  async runAsync(source: string, params: any = []) {
    const lista = Array.isArray(params) ? params : [params];
    const r = this.db.prepare(source).run(...lista);
    return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
  }
  async getFirstAsync<T>(source: string, params: any = []): Promise<T | null> {
    const lista = Array.isArray(params) ? params : [params];
    return (this.db.prepare(source).get(...lista) as T) ?? null;
  }
  async getAllAsync<T>(source: string, params: any = []): Promise<T[]> {
    const lista = Array.isArray(params) ? params : [params];
    return this.db.prepare(source).all(...lista) as T[];
  }
  async withExclusiveTransactionAsync(task: (txn: SQLiteDatabase) => Promise<void>): Promise<void> {
    this.db.exec('BEGIN IMMEDIATE');
    try { await task(this); this.db.exec('COMMIT'); }
    catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  async closeAsync(): Promise<void> { this.db.close(); }
}

export async function openDatabaseAsync(name: string): Promise<SQLiteDatabase> {
  return new SQLiteDatabase(new DatabaseSync(name === ':memory:' ? ':memory:' : name));
}
export function openDatabaseSync(name: string): SQLiteDatabase {
  return new SQLiteDatabase(new DatabaseSync(name));
}
