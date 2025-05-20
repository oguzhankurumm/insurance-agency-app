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
  files?: PolicyFile[];
}

export interface PolicyFile {
  id: number;
  policyId: number;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
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
      console.log("Veritabanı yolu:", dbPath);

      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Tabloları oluştur
      await db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS policies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER NOT NULL,
          policyNumber TEXT NOT NULL,
          plateNumber TEXT,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          premium REAL NOT NULL,
          status TEXT NOT NULL,
          type TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customerId) REFERENCES customers(id)
        );

        CREATE TABLE IF NOT EXISTS accounting (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          policyId INTEGER NOT NULL,
          transactionDate TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (policyId) REFERENCES policies(id)
        );

        CREATE TABLE IF NOT EXISTS policy_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          policyId INTEGER NOT NULL,
          fileName TEXT NOT NULL,
          fileUrl TEXT NOT NULL,
          fileType TEXT NOT NULL,
          fileSize INTEGER NOT NULL,
          uploadDate TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (policyId) REFERENCES policies(id)
        );
      `);

      // Tablo yapısını kontrol et
      const tableInfo = await db.all("PRAGMA table_info(policy_files)");
      console.log("policy_files tablo yapısı:", tableInfo);

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
