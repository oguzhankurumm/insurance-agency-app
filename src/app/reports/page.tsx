"use client";

import { useState, useEffect, useCallback } from "react";
import { CSVLink } from "react-csv";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ReportType, ReportFilter, ReportData } from "@/types/report";
import ReportTable from "@/components/ReportTable";
import ReportChart from "@/components/ReportChart";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [filter, setFilter] = useState<ReportFilter>({});
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filter.startDate) {
        queryParams.append("startDate", filter.startDate.toISOString());
      }
      if (filter.endDate) {
        queryParams.append("endDate", filter.endDate.toISOString());
      }
      if (filter.policyType) {
        queryParams.append("policyType", filter.policyType);
      }
      if (filter.customerName) {
        queryParams.append("customerName", filter.customerName);
      }

      const response = await fetch(
        `/api/reports/${reportType}?${queryParams.toString()}`
      );
      if (!response.ok) throw new Error("Rapor alınamadı");

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [reportType, filter]);

  useEffect(() => {
    if (reportType) {
      fetchReport();
    }
  }, [reportType, filter, fetchReport]);

  const handleExportCSV = () => {
    if (!reportData) return null;

    const headers = Object.keys(reportData.data[0] || {});
    const csvData = reportData.data.map((item) =>
      headers.map((header) => item[header as keyof typeof item])
    );

    return (
      <CSVLink
        data={csvData}
        headers={headers.map((header) => ({ label: header, key: header }))}
        filename={`${reportType}_${new Date().toISOString()}.csv`}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        CSV İndir
      </CSVLink>
    );
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const headers = Object.keys(reportData.data[0] || {});
    const data = reportData.data.map((item) =>
      headers.map((header) => item[header as keyof typeof item])
    );

    (
      doc as unknown as {
        autoTable: (options: {
          head: string[][];
          body: (string | number | undefined)[][];
        }) => void;
      }
    ).autoTable({
      head: [headers],
      body: data,
    });

    doc.save(`${reportType}_${new Date().toISOString()}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Raporlar</h1>

        {/* Rapor Seçimi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rapor Türü
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Rapor Seçin</option>
              <optgroup label="Poliçe Raporları">
                <option value="active-policies">Aktif Poliçeler</option>
                <option value="expiring-policies">
                  Vadesi Yaklaşan Poliçeler
                </option>
                <option value="customer-policies">
                  Müşteri Bazlı Poliçeler
                </option>
              </optgroup>
              <optgroup label="Muhasebe Raporları">
                <option value="monthly">Aylık Gelir-Gider</option>
                <option value="yearly">Yıllık Gelir-Gider</option>
              </optgroup>
            </select>
          </div>

          {/* Filtreler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Tarihi
              </label>
              <DatePicker
                selected={filter.startDate}
                onChange={(date: Date | null) =>
                  setFilter({ ...filter, startDate: date || undefined })
                }
                dateFormat="dd/MM/yyyy"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Tarihi
              </label>
              <DatePicker
                selected={filter.endDate}
                onChange={(date: Date | null) =>
                  setFilter({ ...filter, endDate: date || undefined })
                }
                dateFormat="dd/MM/yyyy"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Yükleme ve Hata Durumları */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Rapor İçeriği */}
        {reportData && !loading && (
          <>
            <div className="mb-6">
              <ReportTable data={reportData.data} type={reportData.type} />
            </div>

            <div className="mb-6">
              <ReportChart data={reportData.data} type={reportData.type} />
            </div>

            {/* Özet Bilgiler */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {reportData.summary.totalPolicies !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">
                      Toplam Poliçe
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {reportData.summary.totalPolicies}
                    </p>
                  </div>
                )}
                {reportData.summary.totalIncome !== undefined && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-500">
                      Toplam Gelir
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-green-900">
                      ₺{reportData.summary.totalIncome.toLocaleString()}
                    </p>
                  </div>
                )}
                {reportData.summary.totalExpense !== undefined && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-red-500">
                      Toplam Gider
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-red-900">
                      ₺{reportData.summary.totalExpense.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dışa Aktarma Butonları */}
            <div className="flex justify-end gap-4">
              {handleExportCSV()}
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                PDF İndir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
