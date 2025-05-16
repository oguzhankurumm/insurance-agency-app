import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

export interface Policy {
  id: number;
  policyNumber: string;
  customerId: number;
  customerName: string;
  tcNumber: string;
  startDate: string;
  endDate: string;
  premium: number;
  policyType: string;
  status: "Aktif" | "Pasif" | "İptal";
  description: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingRecord {
  id: number;
  policyId: number;
  transactionDate: string;
  amount: number;
  type: "Gelir" | "Gider";
  description: string;
}

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    try {
      const dbPath = path.join(process.cwd(), "insurance.db");
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Tabloları oluştur
      await db.exec(`
        CREATE TABLE IF NOT EXISTS policies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          policyNumber TEXT UNIQUE NOT NULL,
          customerId INTEGER NOT NULL,
          customerName TEXT NOT NULL,
          tcNumber TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          premium REAL NOT NULL,
          policyType TEXT NOT NULL,
          status TEXT NOT NULL,
          description TEXT,
          FOREIGN KEY (customerId) REFERENCES customers (id)
        );

        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS accounting (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          policyId INTEGER NOT NULL,
          transactionDate TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          FOREIGN KEY (policyId) REFERENCES policies (id)
        );
      `);

      console.log("Veritabanı bağlantısı başarılı");
    } catch (error) {
      console.error("Veritabanı bağlantısı hatası:", error);
      throw error;
    }
  }
  return db;
}

// Veritabanı bağlantısını kapat
export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log("Veritabanı bağlantısı kapatıldı");
  }
}

export { db };
