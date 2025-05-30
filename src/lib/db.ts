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
  tcNumber: string;
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
          tcNumber TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS policies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER NOT NULL,
          customerName TEXT NOT NULL,
          tcNumber TEXT,
          policyNumber TEXT NOT NULL,
          plateNumber TEXT,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          premium REAL NOT NULL,
          status TEXT NOT NULL,
          policyType TEXT NOT NULL,
          description TEXT,
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
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          type TEXT NOT NULL,
          size INTEGER NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (policyId) REFERENCES policies(id)
        );
      `);

      // Mevcut tabloları güncelle
      try {
        // policies tablosuna eksik sütunları ekle
        await db.exec(`ALTER TABLE policies ADD COLUMN customerName TEXT`);
        await db.exec(`ALTER TABLE policies ADD COLUMN tcNumber TEXT`);
        await db.exec(`ALTER TABLE policies ADD COLUMN description TEXT`);
        await db.exec(`ALTER TABLE policies ADD COLUMN policyType TEXT`);

        // policy_files tablosundaki sütun isimlerini güncelle
        // Önce mevcut verileri yedekle
        await db.exec(
          `CREATE TABLE IF NOT EXISTS policy_files_backup AS SELECT * FROM policy_files`
        );

        // Eski tabloyu sil ve yenisini oluştur
        await db.exec(`DROP TABLE IF EXISTS policy_files`);
        await db.exec(`
          CREATE TABLE policy_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policyId INTEGER NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            type TEXT NOT NULL,
            size INTEGER NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (policyId) REFERENCES policies(id)
          )
        `);

        // Eğer yedekte veri varsa, dönüştürerek geri yükle
        const backupData = await db.all(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='policy_files_backup'`
        );
        if (backupData.length > 0) {
          await db.exec(`
            INSERT INTO policy_files (policyId, name, url, type, size, createdAt)
            SELECT policyId, 
                   COALESCE(fileName, name) as name,
                   COALESCE(fileUrl, url) as url,
                   COALESCE(fileType, type) as type,
                   COALESCE(fileSize, size) as size,
                   COALESCE(uploadDate, createdAt) as createdAt
            FROM policy_files_backup
          `);
          await db.exec(`DROP TABLE policy_files_backup`);
        }
      } catch (error) {
        console.log(
          "Tablo güncellemeleri tamamlandı veya zaten mevcut:",
          error
        );
      }

      // Tablo yapısını kontrol et
      const tableInfo = await db.all("PRAGMA table_info(policy_files)");
      console.log("policy_files tablo yapısı:", tableInfo);

      const policiesInfo = await db.all("PRAGMA table_info(policies)");
      console.log("policies tablo yapısı:", policiesInfo);

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
