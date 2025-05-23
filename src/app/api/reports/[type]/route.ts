import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { ReportType, ReportParams } from "@/types/report";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: ReportType }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const queryParams: ReportParams = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      days: searchParams.get("days") || "30",
    };
    const customerId = searchParams.get("customerId");
    const db = await getDb();

    let dateFilter = "";
    const dateParams: string[] = [];

    if (queryParams.startDate && queryParams.endDate) {
      dateFilter = "AND a.transactionDate BETWEEN ? AND ?";
      dateParams.push(queryParams.startDate, queryParams.endDate);
    }

    switch (type) {
      case "monthly": {
        const query = `
          WITH monthly_totals AS (
            SELECT 
              strftime('%Y-%m', a.transactionDate) as month,
              SUM(CASE WHEN a.type = 'Gelir' THEN a.amount ELSE 0 END) as income,
              SUM(CASE WHEN a.type = 'Gider' THEN a.amount ELSE 0 END) as expense,
              COUNT(DISTINCT a.customerId) as customerCount
            FROM accounting a
            WHERE 1=1 ${dateFilter}
            GROUP BY strftime('%Y-%m', a.transactionDate)
            ORDER BY month DESC
          )
          SELECT 
            month,
            income,
            expense,
            (income - expense) as netAmount,
            customerCount
          FROM monthly_totals
        `;

        const report = await db.all(query, dateParams);
        return NextResponse.json({ type, data: report });
      }

      case "yearly": {
        const query = `
          WITH yearly_totals AS (
            SELECT 
              strftime('%Y', a.transactionDate) as year,
              SUM(CASE WHEN a.type = 'Gelir' THEN a.amount ELSE 0 END) as income,
              SUM(CASE WHEN a.type = 'Gider' THEN a.amount ELSE 0 END) as expense,
              COUNT(DISTINCT a.customerId) as customerCount
            FROM accounting a
            WHERE 1=1 ${dateFilter}
            GROUP BY strftime('%Y', a.transactionDate)
            ORDER BY year DESC
          )
          SELECT 
            year,
            income,
            expense,
            (income - expense) as netAmount,
            customerCount
          FROM yearly_totals
        `;

        const report = await db.all(query, dateParams);
        return NextResponse.json({ type, data: report });
      }

      case "policy-type": {
        const query = `
          WITH policy_type_totals AS (
            SELECT 
              p.policyType,
              SUM(CASE WHEN a.type = 'Gelir' THEN a.amount ELSE 0 END) as income,
              SUM(CASE WHEN a.type = 'Gider' THEN a.amount ELSE 0 END) as expense,
              COUNT(DISTINCT p.id) as policyCount
            FROM policies p
            JOIN customers c ON p.customerId = c.id
            LEFT JOIN accounting a ON a.customerId = c.id
            WHERE 1=1 ${dateFilter}
            GROUP BY p.policyType
          )
          SELECT 
            policyType,
            income,
            expense,
            (income - expense) as netAmount,
            policyCount
          FROM policy_type_totals
          ORDER BY netAmount DESC
        `;

        const report = await db.all(query, dateParams);
        return NextResponse.json({ type, data: report });
      }

      case "customer": {
        const query = `
          WITH customer_totals AS (
            SELECT 
              c.id as customerId,
              c.name as customerName,
              c.tcNumber,
              SUM(CASE WHEN a.type = 'Gelir' THEN a.amount ELSE 0 END) as income,
              SUM(CASE WHEN a.type = 'Gider' THEN a.amount ELSE 0 END) as expense,
              COUNT(DISTINCT p.id) as policyCount
            FROM customers c
            LEFT JOIN accounting a ON a.customerId = c.id
            LEFT JOIN policies p ON p.customerId = c.id
            WHERE 1=1 ${dateFilter}
            GROUP BY c.id, c.name, c.tcNumber
          )
          SELECT 
            customerId,
            customerName,
            tcNumber,
            income,
            expense,
            (income - expense) as netAmount,
            policyCount
          FROM customer_totals
          ORDER BY netAmount DESC
        `;

        const report = await db.all(query, dateParams);
        return NextResponse.json({ type, data: report });
      }

      case "unpaid-payments": {
        // Müşteri bazlı borç-alacak hesaplaması
        const query = `
          WITH customer_balances AS (
            SELECT 
              c.id as customerId,
              c.name as customerName,
              c.tcNumber,
              SUM(CASE WHEN a.type = 'Gelir' THEN a.amount ELSE -a.amount END) as balance,
              MAX(a.transactionDate) as lastTransactionDate
            FROM customers c
            LEFT JOIN accounting a ON a.customerId = c.id
            GROUP BY c.id, c.name, c.tcNumber
            HAVING balance < 0
          )
          SELECT 
            customerId,
            customerName,
            tcNumber,
            ABS(balance) as amount,
            lastTransactionDate as dueDate,
            julianday('now') - julianday(lastTransactionDate) as daysPastDue
          FROM customer_balances
          ORDER BY daysPastDue DESC
        `;

        const report = await db.all(query, []);
        return NextResponse.json({ type, data: report });
      }

      case "active-policies": {
        const query = `
          SELECT 
            id,
            policyNumber,
            customerName,
            startDate,
            endDate,
            premium,
            policyType,
            status,
            plateNumber
          FROM policies
          WHERE status = 'Aktif'
          AND endDate >= date('now')
          ORDER BY endDate ASC
        `;

        const report = await db.all(query, []);
        return NextResponse.json({ type, data: report });
      }

      case "expiring-policies": {
        const query = `
          SELECT 
            id,
            policyNumber,
            customerName,
            endDate,
            julianday(endDate) - julianday('now') as daysUntilExpiry,
            premium,
            policyType,
            plateNumber
          FROM policies
          WHERE status = 'Aktif'
          AND endDate >= date('now')
          AND endDate <= date('now', '+' || ? || ' days')
          ORDER BY endDate ASC
        `;

        const report = await db.all(query, [queryParams.days || "30"]);
        return NextResponse.json({ type, data: report });
      }

      case "customer-policies": {
        const query = `
          SELECT 
            customerId,
            customerName,
            COUNT(CASE WHEN status = 'Aktif' THEN 1 END) as activePolicies,
            SUM(premium) as totalPremium,
            MAX(startDate) as lastPolicyDate
          FROM policies
          GROUP BY customerId, customerName
          HAVING activePolicies > 0
          ORDER BY activePolicies DESC, totalPremium DESC
        `;

        const report = await db.all(query, []);
        return NextResponse.json({ type, data: report });
      }

      case "customer-accounting": {
        let customerFilter = "";
        const accountingParams = [...dateParams];

        if (customerId) {
          customerFilter = "AND c.id = ?";
          accountingParams.push(customerId);
        }

        const query = `
          SELECT 
            c.id as customerId,
            c.name as customerName,
            c.tcNumber,
            a.id as transactionId,
            a.transactionDate,
            a.amount,
            a.type,
            a.description,
            a.plateNumber,
            (
              SELECT SUM(
                CASE WHEN aa.type = 'Gelir' THEN aa.amount 
                     ELSE -aa.amount 
                END
              )
              FROM accounting aa
              WHERE aa.customerId = c.id
              AND aa.transactionDate <= a.transactionDate
            ) as runningBalance
          FROM customers c
          LEFT JOIN accounting a ON a.customerId = c.id
          WHERE 1=1 ${dateFilter} ${customerFilter}
          ORDER BY c.name, a.transactionDate DESC
        `;

        const report = await db.all(query, accountingParams);

        // Müşteri bazında özet bilgiler
        const summaryQuery = `
          SELECT 
            COUNT(DISTINCT c.id) as totalCustomers,
            SUM(CASE WHEN a.type = 'Gelir' THEN a.amount ELSE 0 END) as totalIncome,
            SUM(CASE WHEN a.type = 'Gider' THEN a.amount ELSE 0 END) as totalExpense,
            COUNT(DISTINCT a.id) as totalTransactions
          FROM customers c
          LEFT JOIN accounting a ON a.customerId = c.id
          WHERE 1=1 ${dateFilter} ${customerFilter}
        `;

        const summaryResult = await db.all(summaryQuery, accountingParams);
        const summary =
          (summaryResult[0] as {
            totalCustomers?: number;
            totalIncome?: number;
            totalExpense?: number;
            totalTransactions?: number;
          }) || {};

        return NextResponse.json({
          type,
          data: report,
          summary: {
            totalCustomers: summary.totalCustomers || 0,
            totalIncome: summary.totalIncome || 0,
            totalExpense: summary.totalExpense || 0,
            netAmount: (summary.totalIncome || 0) - (summary.totalExpense || 0),
            totalTransactions: summary.totalTransactions || 0,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Geçersiz rapor türü" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Rapor oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Rapor oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
