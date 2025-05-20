import { useEffect, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import {
  ReportType,
  ReportDataType,
  CustomerPoliciesReport,
  MonthlyReport,
  YearlyReport,
  ActivePoliciesReport,
  ExpiringPoliciesReport,
} from "@/types/report";

Chart.register(...registerables);

interface ReportChartProps {
  data: ReportDataType[];
  type: ReportType;
}

export default function ReportChart({ data, type }: ReportChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const getChartData = useCallback(() => {
    switch (type) {
      case "active-policies":
      case "expiring-policies":
        const policyData = data.filter(
          (item): item is ActivePoliciesReport | ExpiringPoliciesReport =>
            "policyType" in item
        );
        return {
          type: "bar" as const,
          data: {
            labels: policyData.map((item) => item.policyType),
            datasets: [
              {
                label: "Poliçe Sayısı",
                data: policyData.map(() => 1),
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Poliçe Türüne Göre Dağılım",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                },
              },
            },
          },
        };

      case "customer-policies":
        const customerData = data.filter(
          (item): item is CustomerPoliciesReport =>
            "customerName" in item && "activePolicies" in item
        );
        return {
          type: "pie" as const,
          data: {
            labels: customerData.map((item) => item.customerName),
            datasets: [
              {
                data: customerData.map((item) => item.activePolicies),
                backgroundColor: [
                  "rgba(59, 130, 246, 0.5)",
                  "rgba(16, 185, 129, 0.5)",
                  "rgba(245, 158, 11, 0.5)",
                  "rgba(239, 68, 68, 0.5)",
                  "rgba(139, 92, 246, 0.5)",
                ],
                borderColor: [
                  "rgb(59, 130, 246)",
                  "rgb(16, 185, 129)",
                  "rgb(245, 158, 11)",
                  "rgb(239, 68, 68)",
                  "rgb(139, 92, 246)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Müşteri Bazlı Poliçe Dağılımı",
              },
            },
          },
        };

      case "monthly":
      case "yearly":
        const accountingData = data.filter(
          (item): item is MonthlyReport | YearlyReport =>
            "income" in item && "expense" in item
        );
        return {
          type: "line" as const,
          data: {
            labels: accountingData.map((item) =>
              "month" in item ? item.month : item.year
            ),
            datasets: [
              {
                label: "Gelir",
                data: accountingData.map((item) => item.income),
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
              },
              {
                label: "Gider",
                data: accountingData.map((item) => item.expense),
                borderColor: "rgb(239, 68, 68)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Gelir-Gider Grafiği",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (tickValue: string | number) {
                    return `₺${tickValue}`;
                  },
                },
              },
            },
          },
        };

      default:
        return null;
    }
  }, [data, type]);

  useEffect(() => {
    if (!chartRef.current || !data.length) {
      return;
    }

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) {
      return;
    }

    const chartData = getChartData();
    if (!chartData) {
      return;
    }

    chartInstance.current = new Chart(ctx, {
      type: chartData.type,
      data: chartData.data,
      options: chartData.options,
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, getChartData]);

  if (!data.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        Grafik için veri bulunamadı
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <canvas ref={chartRef} />
    </div>
  );
}
