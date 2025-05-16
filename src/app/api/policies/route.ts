import { NextResponse } from "next/server";
import { dbAll, dbRun } from "@/db/database";
import type { Policy } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = "SELECT * FROM policies";
    const params: (string | number)[] = [];

    if (status || search) {
      query += " WHERE";
      const conditions: string[] = [];

      if (status) {
        conditions.push("status = ?");
        params.push(status);
      }

      if (search) {
        conditions.push(
          "(policyNumber LIKE ? OR customerName LIKE ? OR tcNumber LIKE ?)"
        );
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
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
      policyNumber,
      customerId,
      customerName,
      tcNumber,
      startDate,
      endDate,
      premium,
      policyType,
      status,
      description,
    } = data;

    // Poliçe numarasının benzersiz olduğunu kontrol et
    const existingPolicy = await dbAll<Policy>(
      "SELECT id FROM policies WHERE policyNumber = ?",
      [policyNumber]
    );

    if (existingPolicy.length > 0) {
      return NextResponse.json(
        { error: "Bu poliçe numarası zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Yeni poliçeyi ekle
    const result = await dbRun(
      `INSERT INTO policies (
        policyNumber,
        customerId,
        customerName,
        tcNumber,
        startDate,
        endDate,
        premium,
        policyType,
        status,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policyNumber,
        customerId,
        customerName,
        tcNumber,
        startDate,
        endDate,
        premium,
        policyType,
        status,
        description,
      ]
    );

    // Eklenen poliçeyi getir
    const newPolicy = await dbAll<Policy>(
      "SELECT * FROM policies WHERE id = ?",
      [result.lastID]
    );

    return NextResponse.json({ data: newPolicy[0] });
  } catch (error) {
    console.error("Poliçe eklenirken hata:", error);
    return NextResponse.json(
      { error: "Poliçe eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
