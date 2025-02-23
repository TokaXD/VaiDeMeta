import sqlite3 from "sqlite3";

class Database {
  private static instance: Database;
  private db: sqlite3.Database;

  private constructor() {
    this.db = new sqlite3.Database("vaidemeta.db");
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getDatabase(): sqlite3.Database {
    return this.db;
  }

  public createUsersTable(): void {
    this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
  }

  public createMetasTable(): void {
    this.db.run(`
            CREATE TABLE IF NOT EXISTS metas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descricao TEXT,
                concluida BOOLEAN DEFAULT 0,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_vencimento DATETIME,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
  }
}

export default Database;
