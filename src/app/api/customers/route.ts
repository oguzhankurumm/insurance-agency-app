import { getDb } from "@/lib/db";
import type { Customer } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const db = await getDb();

    let query = "SELECT * FROM customers";
    const params: string[] = [];

    if (search) {
      query += " WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += " ORDER BY name ASC";

    const customers = await db.all<Customer>(query, params);
    return NextResponse.json({ data: customers });
  } catch (error) {
    console.error("Müşteriler alınırken hata:", error);
    return NextResponse.json(
      { error: "Müşteriler alınamadı" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const db = await getDb();

    const result = await db.run(
      `INSERT INTO customers (
        name, email, phone, address, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.phone,
        data.address,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    return NextResponse.json(
      {
        data: {
          id: result.lastID,
          message: "Müşteri başarıyla oluşturuldu",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Müşteri oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Müşteri oluşturulamadı" },
      { status: 500 }
    );
  }
}
