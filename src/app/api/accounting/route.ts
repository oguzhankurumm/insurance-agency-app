import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AccountingFormData } from "@/types/accounting";

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get("policyId");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    let query = `
      SELECT a.*, p.policyNumber
      FROM accounting a
      LEFT JOIN policies p ON a.policyId = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (policyId) {
      query += " AND a.policyId = ?";
      params.push(policyId);
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
      query += " AND (a.description LIKE ? OR p.policyNumber LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY a.transactionDate DESC";

    const records = await db.all(query, params);
    return NextResponse.json(records);
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

    // Poliçe kontrolü
    const policy = await db.get("SELECT id FROM policies WHERE id = ?", [
      data.policyId,
    ]);

    if (!policy) {
      return NextResponse.json(
        { error: "Geçersiz poliçe ID" },
        { status: 400 }
      );
    }

    const result = await db.run(
      `INSERT INTO accounting (
        policyId,
        transactionDate,
        amount,
        type,
        description
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        data.policyId,
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
