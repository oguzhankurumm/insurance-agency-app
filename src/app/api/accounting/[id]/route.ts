import { Accounting, dbGet, dbRun } from "@/db/database";
import { NextResponse } from "next/server";

export async function GET(request: Request, params: any) {
  try {
    const { id } = params.params;
    const record = await dbGet<Accounting>(
      "SELECT * FROM accounting WHERE id = ?",
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

export async function PUT(request: Request, params: any) {
  try {
    const { id } = params.params;
    const body = await request.json();
    const { policyId, transactionDate, amount, type, description } = body;

    // Poliçe ID'sinin geçerliliğini kontrol et
    const policy = await dbGet<{ id: number }>(
      "SELECT id FROM policies WHERE id = ?",
      [policyId]
    );

    if (!policy) {
      return NextResponse.json(
        { error: "Geçersiz poliçe ID" },
        { status: 400 }
      );
    }

    // Kaydın var olduğunu kontrol et
    const existingRecord = await dbGet<Accounting>(
      "SELECT id FROM accounting WHERE id = ?",
      [id]
    );

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Güncellenecek kayıt bulunamadı" },
        { status: 404 }
      );
    }

    // Kaydı güncelle
    await dbRun(
      `UPDATE accounting 
       SET policyId = ?, transactionDate = ?, amount = ?, type = ?, description = ?
       WHERE id = ?`,
      [policyId, transactionDate, amount, type, description, id]
    );

    return NextResponse.json({
      data: {
        id,
        policyId,
        transactionDate,
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

export async function DELETE(request: Request, params: any) {
  try {
    const { id } = params.params;
    // Kaydın var olduğunu kontrol et
    const record = await dbGet<Accounting>(
      "SELECT id FROM accounting WHERE id = ?",
      [id]
    );

    if (!record) {
      return NextResponse.json(
        { error: "Silinecek kayıt bulunamadı" },
        { status: 404 }
      );
    }

    // Kaydı sil
    const result = await dbRun("DELETE FROM accounting WHERE id = ?", [id]);

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
