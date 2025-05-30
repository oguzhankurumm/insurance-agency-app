import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Policy, PolicyFile } from "@/lib/db";

// Otomatik poliçe numarası oluşturma fonksiyonu
async function generateUniquePolicyNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  let isUnique = false;
  let policyNumber = "";
  let counter = 1;
  const db = await getDb();

  while (!isUnique) {
    // POL-2025-001 formatında numara oluştur
    policyNumber = `POL-${currentYear}-${counter.toString().padStart(3, "0")}`;

    // Benzersizlik kontrolü
    const existingPolicy = await db.get<Policy>(
      "SELECT id FROM policies WHERE policyNumber = ?",
      [policyNumber]
    );

    if (!existingPolicy) {
      isUnique = true;
    } else {
      counter++;
    }
  }

  return policyNumber;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const plateNumber = searchParams.get("plateNumber");

    const db = await getDb();

    // Customer bilgilerini join ile al
    let query = `
      SELECT 
        p.*,
        c.name as customerName,
        c.tcNumber
      FROM policies p 
      LEFT JOIN customers c ON p.customerId = c.id
    `;
    const params: (string | number)[] = [];

    if (status || search || plateNumber) {
      query += " WHERE";
      const conditions: string[] = [];

      if (status) {
        conditions.push("p.status = ?");
        params.push(status);
      }

      if (search) {
        conditions.push(
          "(p.policyNumber LIKE ? OR COALESCE(p.customerName, c.name) LIKE ? OR COALESCE(p.tcNumber, c.tcNumber) LIKE ? OR p.plateNumber LIKE ?)"
        );
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (plateNumber) {
        conditions.push("p.plateNumber LIKE ?");
        params.push(`%${plateNumber}%`);
      }

      query += " " + conditions.join(" AND ");
    }

    query += " ORDER BY p.startDate DESC";

    const policies = (await db.all<Policy>(
      query,
      params
    )) as unknown as Policy[];

    // Eksik customer bilgilerini güncelle
    for (const policy of policies) {
      if (!policy.customerName && policy.customerId) {
        const customer = await db.get(
          "SELECT name, tcNumber FROM customers WHERE id = ?",
          [policy.customerId]
        );
        if (customer) {
          await db.run(
            "UPDATE policies SET customerName = ?, tcNumber = ? WHERE id = ?",
            [customer.name, customer.tcNumber, policy.id]
          );
          policy.customerName = customer.name;
          policy.tcNumber = customer.tcNumber;
        }
      }
    }

    return NextResponse.json({ data: policies });
  } catch (error) {
    console.error("Poliçeler alınırken hata:", error);
    return NextResponse.json(
      { error: "Poliçeler alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      policyNumber, // Manuel girilen poliçe numarasını al
      customerId,
      customerName,
      tcNumber,
      plateNumber,
      startDate,
      endDate,
      premium,
      policyType,
      status,
      description,
      files,
    } = data;

    const db = await getDb();

    // Poliçe numarası kontrolü - eğer gönderilmişse kullan, yoksa otomatik oluştur
    let finalPolicyNumber = policyNumber;
    if (!finalPolicyNumber || finalPolicyNumber.trim() === "") {
      finalPolicyNumber = await generateUniquePolicyNumber();
    } else {
      // Manuel girilen poliçe numarasının benzersizliğini kontrol et
      const existingPolicy = await db.get<Policy>(
        "SELECT id FROM policies WHERE policyNumber = ?",
        [finalPolicyNumber]
      );

      if (existingPolicy) {
        return NextResponse.json(
          { error: "Bu poliçe numarası zaten kullanılıyor" },
          { status: 400 }
        );
      }
    }

    // Yeni poliçeyi ekle
    const result = await db.run(
      `INSERT INTO policies (
        policyNumber,
        customerId,
        customerName,
        tcNumber,
        plateNumber,
        startDate,
        endDate,
        premium,
        policyType,
        status,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalPolicyNumber, // Güncellenmiş poliçe numarası
        customerId,
        customerName,
        tcNumber,
        plateNumber,
        startDate,
        endDate,
        premium,
        policyType,
        status,
        description,
      ]
    );

    // Dosyaları ekle
    if (files && files.length > 0) {
      for (const file of files) {
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
            result.lastID,
            file.name,
            file.size,
            file.type,
            file.url,
            new Date().toISOString(),
          ]
        );
      }
    }

    // Eklenen poliçeyi getir
    const newPolicy = await db.get<Policy>(
      "SELECT * FROM policies WHERE id = ?",
      [result.lastID]
    );

    // Poliçeye ait dosyaları getir
    const policyFiles = await db.all<PolicyFile>(
      "SELECT * FROM policy_files WHERE policyId = ?",
      [result.lastID]
    );

    return NextResponse.json({
      data: {
        ...newPolicy,
        files: policyFiles,
      },
    });
  } catch (error) {
    console.error("Poliçe eklenirken hata:", error);
    return NextResponse.json(
      { error: "Poliçe eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
