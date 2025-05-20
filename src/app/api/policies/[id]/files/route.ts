import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id: policyId } = await context.params;
    console.log("API çağrısı başladı, policyId:", policyId);

    const db = await getDb();
    console.log("Veritabanı bağlantısı başarılı");

    console.log("Sorgu hazırlanıyor, policyId:", policyId);

    const query = `
      SELECT 
        id,
        policyId,
        name,
        url,
        type,
        size,
        createdAt
      FROM policy_files 
      WHERE policyId = ? 
      ORDER BY createdAt DESC
    `;

    console.log("SQL Sorgusu:", query);
    console.log("Parametreler:", [policyId]);

    const files = await db.all(query, [policyId]);
    console.log("Sorgu sonucu:", files);

    return NextResponse.json(files);
  } catch (error) {
    console.error("Hata detayı:", error);
    if (error instanceof Error) {
      console.error("Hata mesajı:", error.message);
      console.error("Hata stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Dosyalar alınamadı",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}
