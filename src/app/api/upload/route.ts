import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { unlink } from "fs/promises";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Uploads klasörünü oluştur
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Benzersiz dosya adı oluştur
    const uniqueFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}-${file.name}`;
    const filePath = join(uploadDir, uniqueFileName);

    // Dosyayı kaydet
    await writeFile(filePath, buffer);

    return NextResponse.json({
      data: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: `/uploads/${uniqueFileName}`,
      },
    });
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Dosya URL'i belirtilmedi" },
        { status: 400 }
      );
    }

    // URL'den dosya adını al
    const fileName = fileUrl.split("/").pop();
    if (!fileName) {
      return NextResponse.json(
        { error: "Geçersiz dosya URL'i" },
        { status: 400 }
      );
    }

    // Dosya yolunu oluştur
    const filePath = join(process.cwd(), "public", fileUrl);

    try {
      // Dosyayı sil
      await unlink(filePath);
      return NextResponse.json({ message: "Dosya başarıyla silindi" });
    } catch (error) {
      console.error("Dosya silme hatası:", error);
      return NextResponse.json(
        { error: "Dosya silinirken bir hata oluştu" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Dosya silme işlemi hatası:", error);
    return NextResponse.json(
      { error: "Dosya silme işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
