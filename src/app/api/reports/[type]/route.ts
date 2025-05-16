import { NextResponse } from "next/server";
import { dbAll } from "@/db/database";
import type {
  ReportType,
  ReportParams,
  MonthlyReport,
  YearlyReport,
  PolicyTypeReport,
  CustomerReport,
  UnpaidPaymentsReport,
  ActivePoliciesReport,
  ExpiringPoliciesReport,
  CustomerPoliciesReport,
} from "@/types/report";

export async function GET(request: Request, params: any) {
  try {
    const { type } = params.params as { type: ReportType };
    const { searchParams } = new URL(request.url);
    const queryParams: ReportParams = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      days: searchParams.get("days") || "30",
    };

    let dateFilter = "";
    const dateParams: string[] = [];

    if (queryParams.startDate && queryParams.endDate) {
      dateFilter = "AND transactionDate BETWEEN ? AND ?";
      dateParams.push(queryParams.startDate, queryParams.endDate);
    }

    switch (type) {
      case "monthly": {
        const query = `
          WITH monthly_totals AS (
            SELECT 
              strftime('%Y-%m', transactionDate) as month,
              SUM(CASE WHEN type = 'Gelir' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN type = 'Gider' THEN amount ELSE 0 END) as expense,
              COUNT(DISTINCT policyId) as policyCount
            FROM accounting
            WHERE 1=1 ${dateFilter}
            GROUP BY strftime('%Y-%m', transactionDate)
            ORDER BY month DESC
          )
          SELECT 
            month,
            income,
            expense,
            (income - expense) as netAmount,
            policyCount
          FROM monthly_totals
        `;

        const report = await dbAll<MonthlyReport>(query, dateParams);
        return NextResponse.json({ data: report });
      }

      case "yearly": {
        const query = `
          WITH yearly_totals AS (
            SELECT 
              strftime('%Y', transactionDate) as year,
              SUM(CASE WHEN type = 'Gelir' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN type = 'Gider' THEN amount ELSE 0 END) as expense,
              COUNT(DISTINCT policyId) as policyCount
            FROM accounting
            WHERE 1=1 ${dateFilter}
            GROUP BY strftime('%Y', transactionDate)
            ORDER BY year DESC
          )
          SELECT 
            year,
            income,
            expense,
            (income - expense) as netAmount,
            policyCount
          FROM yearly_totals
        `;

        const report = await dbAll<YearlyReport>(query, dateParams);
        return NextResponse.json({ data: report });
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
            LEFT JOIN accounting a ON p.id = a.policyId
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

        const report = await dbAll<PolicyTypeReport>(query, dateParams);
        return NextResponse.json({ data: report });
      }

      case "customer": {
        const query = `
          WITH customer_totals AS (
            SELECT 
              p.customerId,
              p.customerName,
              SUM(CASE WHEN a.type = 'Gelir' THEN a.amount ELSE 0 END) as income,
              SUM(CASE WHEN a.type = 'Gider' THEN a.amount ELSE 0 END) as expense,
              COUNT(DISTINCT p.id) as policyCount
            FROM policies p
            LEFT JOIN accounting a ON p.id = a.policyId
            WHERE 1=1 ${dateFilter}
            GROUP BY p.customerId, p.customerName
          )
          SELECT 
            customerId,
            customerName,
            income,
            expense,
            (income - expense) as netAmount,
            policyCount
          FROM customer_totals
          ORDER BY netAmount DESC
        `;

        const report = await dbAll<CustomerReport>(query, dateParams);
        return NextResponse.json({ data: report });
      }

      case "unpaid-payments": {
        const query = `
          SELECT 
            p.id as policyId,
            p.policyNumber,
            p.customerName,
            a.transactionDate as dueDate,
            a.amount,
            julianday('now') - julianday(a.transactionDate) as daysPastDue
          FROM policies p
          JOIN accounting a ON p.id = a.policyId
          WHERE a.type = 'Gelir'
          AND a.amount > (
            SELECT COALESCE(SUM(amount), 0)
            FROM accounting
            WHERE policyId = p.id
            AND type = 'Gider'
          )
          ORDER BY daysPastDue DESC
        `;

        const report = await dbAll<UnpaidPaymentsReport>(query, []);
        return NextResponse.json({ data: report });
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
            status
          FROM policies
          WHERE status = 'Aktif'
          AND endDate >= date('now')
          ORDER BY endDate ASC
        `;

        const report = await dbAll<ActivePoliciesReport>(query, []);
        return NextResponse.json({ data: report });
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
            policyType
          FROM policies
          WHERE status = 'Aktif'
          AND endDate >= date('now')
          AND endDate <= date('now', '+' || ? || ' days')
          ORDER BY endDate ASC
        `;

        const report = await dbAll<ExpiringPoliciesReport>(query, [
          queryParams.days || "30",
        ]);
        return NextResponse.json({ data: report });
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

        const report = await dbAll<CustomerPoliciesReport>(query, []);
        return NextResponse.json({ data: report });
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
