import { getDb } from "@/lib/db";
import type { Policy, AccountingRecord, Customer } from "@/lib/db";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface BackupData {
  policies: Policy[];
  customers: Customer[];
  accounting: AccountingRecord[];
  timestamp: string;
}

export async function GET() {
  try {
    const db = await getDb();

    // Tüm tabloları al
    const policies = await db.all<Policy[]>("SELECT * FROM policies");
    const customers = await db.all<Customer[]>("SELECT * FROM customers");
    const accounting = await db.all<AccountingRecord[]>(
      "SELECT * FROM accounting"
    );

    // Yedek verilerini hazırla
    const backupData: BackupData = {
      policies,
      customers,
      accounting,
      timestamp: new Date().toISOString(),
    };

    // Yedek dizinini oluştur (yoksa)
    const backupDir = path.join(process.cwd(), "backups");
    await mkdir(backupDir, { recursive: true });

    // Yedek dosyasını oluştur
    const backupFile = path.join(
      backupDir,
      `backup_${backupData.timestamp.replace(/[:.]/g, "-")}.json`
    );

    await writeFile(backupFile, JSON.stringify(backupData, null, 2));

    return NextResponse.json({
      data: {
        message: "Yedekleme başarıyla tamamlandı",
        file: backupFile,
        timestamp: backupData.timestamp,
      },
    });
  } catch (error) {
    console.error("Yedekleme sırasında hata:", error);
    return NextResponse.json(
      { error: "Yedekleme sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { policies, customers, accounting } = data as BackupData;
    const db = await getDb();

    // Tabloları temizle
    await db.run("DELETE FROM accounting");
    await db.run("DELETE FROM policies");
    await db.run("DELETE FROM customers");

    // Verileri geri yükle
    for (const customer of customers) {
      await db.run(
        `INSERT INTO customers (
          id, name, email, phone, address, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.address,
          customer.createdAt,
          customer.updatedAt,
        ]
      );
    }

    for (const policy of policies) {
      await db.run(
        `INSERT INTO policies (
          id, policyNumber, customerId, tcNumber,
          startDate, endDate, premium, policyType, status, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          policy.id,
          policy.policyNumber,
          policy.customerId,
          policy.tcNumber,
          policy.startDate,
          policy.endDate,
          policy.premium,
          policy.policyType,
          policy.status,
          policy.description,
        ]
      );
    }

    for (const record of accounting) {
      await db.run(
        `INSERT INTO accounting (
          id, policyId, transactionDate, amount, type, description
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.policyId,
          record.transactionDate,
          record.amount,
          record.type,
          record.description,
        ]
      );
    }

    return NextResponse.json({
      data: {
        message: "Yedek başarıyla geri yüklendi",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Yedek geri yüklenirken hata:", error);
    return NextResponse.json(
      { error: "Yedek geri yüklenemedi" },
      { status: 500 }
    );
  }
}
