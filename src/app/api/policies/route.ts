import { NextResponse } from "next/server";
import { dbAll, dbRun } from "@/db/database";
import type { Policy, PolicyFile } from "@/lib/db";

// Otomatik poliçe numarası oluşturma fonksiyonu
async function generateUniquePolicyNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  let isUnique = false;
  let policyNumber = "";
  let counter = 1;

  while (!isUnique) {
    // POL-2025-001 formatında numara oluştur
    policyNumber = `POL-${currentYear}-${counter.toString().padStart(3, "0")}`;

    // Benzersizlik kontrolü
    const existingPolicy = await dbAll<Policy>(
      "SELECT id FROM policies WHERE policyNumber = ?",
      [policyNumber]
    );

    if (existingPolicy.length === 0) {
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

    let query = "SELECT * FROM policies";
    const params: (string | number)[] = [];

    if (status || search || plateNumber) {
      query += " WHERE";
      const conditions: string[] = [];

      if (status) {
        conditions.push("status = ?");
        params.push(status);
      }

      if (search) {
        conditions.push(
          "(policyNumber LIKE ? OR customerName LIKE ? OR tcNumber LIKE ? OR plateNumber LIKE ?)"
        );
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (plateNumber) {
        conditions.push("plateNumber LIKE ?");
        params.push(`%${plateNumber}%`);
      }

      query += " " + conditions.join(" AND ");
    }

    query += " ORDER BY startDate DESC";

    const policies = await dbAll<Policy>(query, params);
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

    // Otomatik poliçe numarası oluştur
    const policyNumber = await generateUniquePolicyNumber();

    // Yeni poliçeyi ekle
    const result = await dbRun(
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
        description,
      ]
    );

    // Dosyaları ekle
    if (files && files.length > 0) {
      for (const file of files) {
        await dbRun(
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
    const newPolicy = await dbAll<Policy>(
      "SELECT * FROM policies WHERE id = ?",
      [result.lastID]
    );

    // Poliçeye ait dosyaları getir
    const policyFiles = await dbAll<PolicyFile>(
      "SELECT * FROM policy_files WHERE policyId = ?",
      [result.lastID]
    );

    return NextResponse.json({
      data: {
        ...newPolicy[0],
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
