import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { writeFile, unlink } from "fs/promises";
import path from "path";

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

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id: policyId } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya adını benzersiz yap
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}-${file.name}`;

    // Uploads klasörünü oluştur
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await writeFile(path.join(uploadsDir, uniqueFileName), buffer);

    const db = await getDb();
    const query = `
      INSERT INTO policy_files (
        policyId,
        name,
        url,
        type,
        size,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const fileUrl = `/uploads/${uniqueFileName}`;
    const result = await db.run(query, [
      policyId,
      file.name,
      fileUrl,
      file.type,
      file.size,
      new Date().toISOString(),
    ]);

    return NextResponse.json({
      id: result.lastID,
      policyId,
      name: file.name,
      url: fileUrl,
      type: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      {
        error: "Dosya yüklenemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id: policyId } = await context.params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "Dosya ID'si gerekli" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Önce dosya bilgilerini al
    const fileQuery =
      "SELECT url FROM policy_files WHERE id = ? AND policyId = ?";
    const file = await db.get(fileQuery, [fileId, policyId]);

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    // Dosyayı fiziksel olarak sil
    const filePath = path.join(process.cwd(), "public", file.url);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error("Dosya silinirken hata:", error);
      // Dosya zaten silinmiş olabilir, devam et
    }

    // Veritabanından kaydı sil
    const deleteQuery =
      "DELETE FROM policy_files WHERE id = ? AND policyId = ?";
    await db.run(deleteQuery, [fileId, policyId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Dosya silme hatası:", error);
    return NextResponse.json(
      {
        error: "Dosya silinemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}
