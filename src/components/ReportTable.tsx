import { ReportType, ReportDataType } from "@/types/report";

interface ReportTableProps {
  data: ReportDataType[];
  type: ReportType;
}

export default function ReportTable({ data, type }: ReportTableProps) {
  const getColumns = () => {
    switch (type) {
      case "active-policies":
      case "expiring-policies":
        return [
          { header: "Poliçe No", accessor: "policyNumber" },
          { header: "Müşteri", accessor: "customerName" },
          { header: "Poliçe Türü", accessor: "policyType" },
          { header: "Başlangıç", accessor: "startDate" },
          { header: "Bitiş", accessor: "endDate" },
          { header: "Prim", accessor: "premium" },
          { header: "Durum", accessor: "status" },
        ];
      case "customer-policies":
        return [
          { header: "Müşteri", accessor: "customerName" },
          { header: "Aktif Poliçe", accessor: "activePolicies" },
          { header: "Toplam Prim", accessor: "totalPremium" },
          { header: "Son Poliçe", accessor: "lastPolicyDate" },
        ];
      case "monthly":
      case "yearly":
        return [
          {
            header: type === "monthly" ? "Ay" : "Yıl",
            accessor: type === "monthly" ? "month" : "year",
          },
          { header: "Gelir", accessor: "income" },
          { header: "Gider", accessor: "expense" },
          { header: "Net", accessor: "netAmount" },
          { header: "Poliçe Sayısı", accessor: "policyCount" },
        ];
      default:
        return [];
    }
  };

  const formatValue = (
    value: string | number | Date | null | undefined,
    accessor: string
  ): string => {
    if (value === null || value === undefined) return "-";

    switch (accessor) {
      case "startDate":
      case "endDate":
      case "lastPolicyDate":
        return new Date(value).toLocaleDateString("tr-TR");
      case "premium":
      case "totalPremium":
      case "income":
      case "expense":
      case "netAmount":
        return `₺${Number(value).toLocaleString("tr-TR")}`;
      case "status":
        return String(value);
      default:
        return String(value);
    }
  };

  const columns = getColumns();

  if (!data.length) {
    return (
      <div className="text-center py-4 text-gray-500">Veri bulunamadı</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.accessor}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {formatValue(
                    row[column.accessor as keyof typeof row],
                    column.accessor
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
