import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PolicyFormData } from "@/types/policy";

// Poliçe numarası benzersizlik kontrolü
async function isPolicyNumberUnique(policyNumber: string): Promise<boolean> {
  const db = await getDb();
  const query = "SELECT COUNT(*) as count FROM policies WHERE policyNumber = ?";
  const result = await db.get(query, [policyNumber]);
  return result.count === 0;
}

export async function GET() {
  try {
    // Yeni poliçe için gerekli varsayılan değerleri döndür
    return NextResponse.json({
      policyNumber: "",
      customerName: "",
      tcNumber: "",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 yıl sonrası
      premium: 0,
      policyType: "",
      status: "Aktif",
      description: "",
    });
  } catch (error) {
    console.error("Yeni poliçe formu alınırken hata:", error);
    return NextResponse.json(
      { error: "Form verileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data: PolicyFormData = await request.json();

    // Poliçe numarası benzersizlik kontrolü
    const isUnique = await isPolicyNumberUnique(data.policyNumber);
    if (!isUnique) {
      return NextResponse.json(
        { error: "Bu poliçe numarası zaten kullanılıyor" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO policies (
        policyNumber,
        customerName,
        tcNumber,
        startDate,
        endDate,
        premium,
        policyType,
        status,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.policyNumber,
      data.customerName,
      data.tcNumber,
      data.startDate,
      data.endDate,
      data.premium,
      data.policyType,
      data.status,
      data.description,
    ];

    const result = await db.run(query, params);

    return NextResponse.json(
      { id: result.lastID, message: "Poliçe başarıyla oluşturuldu" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Poliçe oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Poliçe oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
