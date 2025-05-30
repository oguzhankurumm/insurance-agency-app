import { dbAll, dbGet, dbRun } from "@/db/database";
import { Policy } from "@/lib/db";
import { NextResponse } from "next/server";

interface Customer {
  id: number;
  name: string;
  tcNumber: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    // Müşteri bilgilerini al
    const customer = await dbGet<Customer>(
      "SELECT * FROM customers WHERE id = ?",
      [id]
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Müşterinin poliçelerini al
    const policies = await dbAll<Policy>(
      "SELECT * FROM policies WHERE customerId = ? ORDER BY startDate DESC",
      [id]
    );

    return NextResponse.json({
      data: {
        ...customer,
        policies,
      },
    });
  } catch (error) {
    console.error("Müşteri detayları alınırken hata:", error);
    return NextResponse.json(
      { error: "Müşteri detayları alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const data = await request.json();
    const { name, tcNumber, email, phone, address } = data;

    // Müşterinin var olduğunu kontrol et
    const customer = await dbGet<Customer>(
      "SELECT id FROM customers WHERE id = ?",
      [id]
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Güncellenecek müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Müşteriyi güncelle
    await dbRun(
      `UPDATE customers SET
        name = ?,
        tcNumber = ?,
        email = ?,
        phone = ?,
        address = ?,
        updatedAt = datetime('now')
      WHERE id = ?`,
      [name, tcNumber, email, phone, address, id]
    );

    // Güncellenmiş müşteriyi getir
    const updatedCustomer = await dbGet<Customer>(
      "SELECT * FROM customers WHERE id = ?",
      [id]
    );

    return NextResponse.json({ data: updatedCustomer });
  } catch (error) {
    console.error("Müşteri güncellenirken hata:", error);
    return NextResponse.json(
      { error: "Müşteri güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    // Müşterinin var olduğunu kontrol et
    const customer = await dbGet<Customer>(
      "SELECT id FROM customers WHERE id = ?",
      [id]
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Silinecek müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Müşteriye bağlı poliçeleri kontrol et
    const policies = await dbAll<Policy>(
      "SELECT id FROM policies WHERE customerId = ?",
      [id]
    );

    if (policies.length > 0) {
      return NextResponse.json(
        {
          error:
            "Bu müşteriye bağlı poliçeler var. Önce poliçeleri silmelisiniz.",
        },
        { status: 400 }
      );
    }

    // Müşteriyi sil
    const result = await dbRun("DELETE FROM customers WHERE id = ?", [id]);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Müşteri silinemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Müşteri silinirken hata:", error);
    return NextResponse.json(
      { error: "Müşteri silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
