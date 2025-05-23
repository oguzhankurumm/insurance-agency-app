import { getDb } from "@/lib/db";

async function migrateAccounting() {
  const db = await getDb();

  try {
    console.log("Muhasebe tablosu migration işlemi başlıyor...");

    // Önce mevcut tabloyu yedekle
    await db.run(`
      CREATE TABLE IF NOT EXISTS accounting_backup AS 
      SELECT * FROM accounting
    `);
    console.log("Mevcut veriler yedeklendi.");

    // Mevcut tabloyu sil
    await db.run("DROP TABLE IF EXISTS accounting");
    console.log("Eski tablo silindi.");

    // Yeni tabloyu oluştur
    await db.run(`
      CREATE TABLE accounting (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        plateNumber TEXT,
        transactionDate TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Gelir', 'Gider')),
        description TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers (id)
      )
    `);
    console.log("Yeni muhasebe tablosu oluşturuldu.");

    // Mevcut verileri dönüştür (eğer varsa)
    const backupRecords = await db.all("SELECT * FROM accounting_backup");

    if (backupRecords.length > 0) {
      console.log(`${backupRecords.length} adet kayıt dönüştürülüyor...`);

      for (const record of backupRecords) {
        // policyId'den customerId'yi al
        const policy = await db.get(
          "SELECT customerId, plateNumber FROM policies WHERE id = ?",
          [record.policyId]
        );

        if (policy) {
          await db.run(
            `
            INSERT INTO accounting (
              customerId, plateNumber, transactionDate, amount, type, description, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
            [
              policy.customerId,
              policy.plateNumber || null,
              record.transactionDate,
              record.amount,
              record.type,
              record.description,
              record.createdAt || new Date().toISOString(),
            ]
          );
        }
      }
      console.log("Veriler başarıyla dönüştürüldü.");
    }

    // Yedek tabloyu sil
    await db.run("DROP TABLE accounting_backup");
    console.log("Yedek tablo temizlendi.");

    console.log("Migration tamamlandı!");
  } catch (error) {
    console.error("Migration sırasında hata:", error);

    // Hata durumunda geri al
    try {
      await db.run("DROP TABLE IF EXISTS accounting");
      await db.run("ALTER TABLE accounting_backup RENAME TO accounting");
      console.log("Hata nedeniyle değişiklikler geri alındı.");
    } catch (rollbackError) {
      console.error("Rollback hatası:", rollbackError);
    }

    throw error;
  }
}

migrateAccounting().catch(console.error);
