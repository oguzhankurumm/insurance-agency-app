import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AccountingFormData } from "@/types/accounting";

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const plateNumber = searchParams.get("plateNumber");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    let query = `
      SELECT a.*, c.name as customerName, c.tcNumber
      FROM accounting a
      LEFT JOIN customers c ON a.customerId = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (customerId) {
      query += " AND a.customerId = ?";
      params.push(customerId);
    }

    if (plateNumber) {
      query += " AND a.plateNumber = ?";
      params.push(plateNumber);
    }

    if (type) {
      query += " AND a.type = ?";
      params.push(type);
    }

    if (startDate) {
      query += " AND a.transactionDate >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND a.transactionDate <= ?";
      params.push(endDate);
    }

    if (search) {
      query +=
        " AND (a.description LIKE ? OR c.name LIKE ? OR c.tcNumber LIKE ? OR a.plateNumber LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY a.transactionDate DESC";

    const records = await db.all(query, params);
    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("Error fetching accounting records:", error);
    return NextResponse.json({ error: "Kayıtlar alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data: AccountingFormData = await request.json();

    // transactionDate'i Date objesine çevir
    const transactionDate = new Date(data.transactionDate);

    // Müşteri kontrolü
    const customer = await db.get("SELECT id FROM customers WHERE id = ?", [
      data.customerId,
    ]);

    if (!customer) {
      return NextResponse.json(
        { error: "Geçersiz müşteri ID" },
        { status: 400 }
      );
    }

    const result = await db.run(
      `INSERT INTO accounting (
        customerId,
        plateNumber,
        transactionDate,
        amount,
        type,
        description
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.customerId,
        data.plateNumber || null,
        transactionDate.toISOString(),
        data.amount,
        data.type,
        data.description,
      ]
    );

    return NextResponse.json(
      { id: result.lastID, message: "Kayıt başarıyla oluşturuldu" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating accounting record:", error);
    return NextResponse.json(
      { error: "Kayıt oluşturulamadı" },
      { status: 500 }
    );
  }
}
