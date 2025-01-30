// database.ts
import pg, { Client } from 'pg';

class Database {
  private static instance: Database;

  private client: Client;

  private isConnected = false;

  private constructor() {
    this.client = new pg.Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE_NAME,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      await this.initializeDatabase();
    }
    return this.client;
  }

  private async initializeDatabase() {
    await this.client.query(`
            CREATE TABLE IF NOT EXISTS records (
                id SERIAL PRIMARY KEY,
                url TEXT,
                title TEXT,
                description TEXT,
                category SMALLINT
            )
        `);
  }

  public async disconnect() {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
    }
  }
}

// Create singleton instance and export
const db = Database.getInstance();
export default db;
