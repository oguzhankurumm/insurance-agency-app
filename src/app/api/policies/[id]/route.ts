import { getDb } from "@/lib/db";
import type { Policy, AccountingRecord, PolicyFile } from "@/lib/db";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Poliçe bilgilerini müşteri bilgileriyle birlikte al
    const policy = await db.get<Policy>(
      `
      SELECT 
        p.*,
        c.name as customerName,
        c.tcNumber
      FROM policies p 
      LEFT JOIN customers c ON p.customerId = c.id 
      WHERE p.id = ?
    `,
      [id]
    );

    if (!policy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    // Eğer customerName veya tcNumber null ise, customers tablosundan güncelle
    if (!policy.customerName && policy.customerId) {
      const customer = await db.get(
        "SELECT name, tcNumber FROM customers WHERE id = ?",
        [policy.customerId]
      );
      if (customer) {
        await db.run(
          "UPDATE policies SET customerName = ?, tcNumber = ? WHERE id = ?",
          [customer.name, customer.tcNumber, id]
        );
        policy.customerName = customer.name;
        policy.tcNumber = customer.tcNumber;
      }
    }

    // Poliçeye ait dosyaları al
    const files = await db.all<PolicyFile>(
      "SELECT * FROM policy_files WHERE policyId = ? ORDER BY createdAt DESC",
      [id]
    );

    // Poliçeye ait muhasebe kayıtlarını al
    const accountingRecords = await db.all<AccountingRecord>(
      "SELECT * FROM accounting WHERE customerId = ? ORDER BY transactionDate DESC",
      [policy.customerId]
    );

    return NextResponse.json({
      data: {
        policy: {
          ...policy,
          files,
        },
        accountingRecords,
      },
    });
  } catch (error) {
    console.error("Poliçe detayları alınırken hata:", error);
    return NextResponse.json(
      { error: "Poliçe detayları alınamadı" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();
    const db = await getDb();

    // Poliçeyi güncelle
    const result = await db.run(
      `UPDATE policies SET
        policyNumber = ?,
        customerId = ?,
        customerName = ?,
        tcNumber = ?,
        plateNumber = ?,
        startDate = ?,
        endDate = ?,
        premium = ?,
        policyType = ?,
        status = ?,
        description = ?
      WHERE id = ?`,
      [
        data.policyNumber,
        data.customerId,
        data.customerName,
        data.tcNumber,
        data.plateNumber,
        data.startDate,
        data.endDate,
        data.premium,
        data.policyType,
        data.status,
        data.description,
        id,
      ]
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    // Mevcut dosyaları sil
    await db.run("DELETE FROM policy_files WHERE policyId = ?", [id]);

    // Yeni dosyaları ekle
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        await db.run(
          `INSERT INTO policy_files (
            policyId,
            name,
            size,
            type,
            url,
            createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            file.name,
            file.size,
            file.type,
            file.url,
            new Date().toISOString(),
          ]
        );
      }
    }

    // Güncellenmiş poliçeyi müşteri bilgileriyle birlikte getir
    const updatedPolicy = await db.get<Policy>(
      `
      SELECT 
        p.*,
        c.name as customerName,
        c.tcNumber
      FROM policies p 
      LEFT JOIN customers c ON p.customerId = c.id 
      WHERE p.id = ?
    `,
      [id]
    );

    const policyFiles = await db.all<PolicyFile>(
      "SELECT * FROM policy_files WHERE policyId = ?",
      [id]
    );

    return NextResponse.json({
      data: {
        ...updatedPolicy,
        files: policyFiles,
      },
    });
  } catch (error) {
    console.error("Poliçe güncellenirken hata:", error);
    return NextResponse.json(
      { error: "Poliçe güncellenemedi" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Poliçeyi sil (dosyalar da otomatik silinecek foreign key cascade ile)
    const result = await db.run("DELETE FROM policies WHERE id = ?", [id]);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        message: "Poliçe başarıyla silindi",
        id: id,
      },
    });
  } catch (error) {
    console.error("Poliçe silinirken hata:", error);
    return NextResponse.json({ error: "Poliçe silinemedi" }, { status: 500 });
  }
}
