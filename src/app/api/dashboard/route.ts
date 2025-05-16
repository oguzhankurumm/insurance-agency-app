import { getDb } from "@/lib/db";
import type { Policy, AccountingRecord } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();

    // Son 5 poliçeyi al
    const recentPolicies = await db.all<Policy>(
      "SELECT * FROM policies ORDER BY id DESC LIMIT 5"
    );

    // Aktif poliçe sayısı
    const activePoliciesCount = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM policies WHERE status = 'Aktif'"
    );

    // Son 5 muhasebe kaydı
    const recentTransactions = await db.all<AccountingRecord>(
      "SELECT * FROM accounting ORDER BY transactionDate DESC LIMIT 5"
    );

    // Toplam gelir
    const totalIncome = await db.get<{ total: number }>(
      "SELECT SUM(amount) as total FROM accounting WHERE type = 'Gelir'"
    );

    // Toplam gider
    const totalExpense = await db.get<{ total: number }>(
      "SELECT SUM(amount) as total FROM accounting WHERE type = 'Gider'"
    );

    return NextResponse.json({
      data: {
        recentPolicies,
        activePoliciesCount: activePoliciesCount?.count || 0,
        recentTransactions,
        totalIncome: totalIncome?.total || 0,
        totalExpense: totalExpense?.total || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard verileri alınırken hata:", error);
    return NextResponse.json(
      { error: "Dashboard verileri alınamadı" },
      { status: 500 }
    );
  }
}
