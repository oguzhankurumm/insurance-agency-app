import { getDb } from "@/lib/db";
import type { Policy, AccountingRecord } from "@/lib/db";
import { NextResponse } from "next/server";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const db = await getDb();

    // Poliçe bilgilerini al
    const policy = await db.get<Policy>("SELECT * FROM policies WHERE id = ?", [
      id,
    ]);

    if (!policy) {
      return NextResponse.json({ error: "Poliçe bulunamadı" }, { status: 404 });
    }

    // Poliçeye ait muhasebe kayıtlarını al
    const accountingRecords = await db.all<AccountingRecord>(
      "SELECT * FROM accounting WHERE policyId = ? ORDER BY transactionDate DESC",
      [id]
    );

    return NextResponse.json({
      data: {
        policy,
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
    const { id } = params;
    const data = await request.json();
    const db = await getDb();

    // Poliçeyi güncelle
    const result = await db.run(
      `UPDATE policies SET
        policyNumber = ?,
        customerId = ?,
        tcNumber = ?,
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
        data.tcNumber,
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

    return NextResponse.json({
      data: {
        message: "Poliçe başarıyla güncellendi",
        id: id,
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
    const { id } = params;
    const db = await getDb();

    // Poliçeye bağlı muhasebe kayıtlarını kontrol et
    const accountingRecords = await db.all<AccountingRecord[]>(
      "SELECT id FROM accounting WHERE policyId = ?",
      [id]
    );

    if (accountingRecords && accountingRecords.length > 0) {
      return NextResponse.json(
        {
          error:
            "Bu poliçeye ait muhasebe kayıtları bulunmaktadır. Önce muhasebe kayıtlarını silmelisiniz.",
        },
        { status: 400 }
      );
    }

    // Poliçeyi sil
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
