import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { AccountingFormData } from "@/types/accounting";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const db = await getDb();

    const record = await db.get(
      `SELECT a.*, c.name as customerName, c.tcNumber
       FROM accounting a
       LEFT JOIN customers c ON a.customerId = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (!record) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Kayıt alınırken hata:", error);
    return NextResponse.json(
      { error: "Kayıt alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const body: AccountingFormData = await request.json();
    const {
      customerId,
      plateNumber,
      transactionDate,
      amount,
      type,
      description,
    } = body;

    const db = await getDb();

    // Müşteri ID'sinin geçerliliğini kontrol et
    const customer = await db.get("SELECT id FROM customers WHERE id = ?", [
      customerId,
    ]);

    if (!customer) {
      return NextResponse.json(
        { error: "Geçersiz müşteri ID" },
        { status: 400 }
      );
    }

    // Kaydın var olduğunu kontrol et
    const existingRecord = await db.get(
      "SELECT id FROM accounting WHERE id = ?",
      [id]
    );

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Güncellenecek kayıt bulunamadı" },
        { status: 404 }
      );
    }

    // transactionDate'i Date objesine çevir
    const formattedDate = new Date(transactionDate).toISOString();

    // Kaydı güncelle
    await db.run(
      `UPDATE accounting 
       SET customerId = ?, plateNumber = ?, transactionDate = ?, amount = ?, type = ?, description = ?
       WHERE id = ?`,
      [
        customerId,
        plateNumber || null,
        formattedDate,
        amount,
        type,
        description,
        id,
      ]
    );

    return NextResponse.json({
      data: {
        id,
        customerId,
        plateNumber,
        transactionDate: formattedDate,
        amount,
        type,
        description,
      },
    });
  } catch (error) {
    console.error("Kayıt güncellenirken hata:", error);
    return NextResponse.json(
      { error: "Kayıt güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const db = await getDb();

    // Kaydın var olduğunu kontrol et
    const record = await db.get("SELECT id FROM accounting WHERE id = ?", [id]);

    if (!record) {
      return NextResponse.json(
        { error: "Silinecek kayıt bulunamadı" },
        { status: 404 }
      );
    }

    // Kaydı sil
    const result = await db.run("DELETE FROM accounting WHERE id = ?", [id]);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Kayıt silinemedi" }, { status: 500 });
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Kayıt silinirken hata:", error);
    return NextResponse.json(
      { error: "Kayıt silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
