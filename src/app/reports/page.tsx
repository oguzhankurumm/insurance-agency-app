"use client";

import { useState, useEffect, useCallback } from "react";
import { CSVLink } from "react-csv";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ReportType,
  ReportFilter,
  ReportData,
  CustomerAccountingReport,
} from "@/types/report";
import ReportTable from "@/components/ReportTable";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [filter, setFilter] = useState<ReportFilter>({});
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<
    { id: number; name: string; tcNumber: string }[]
  >([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Müşteriler alınamadı");
      const data = await response.json();
      setCustomers(data.data || []);
    } catch (error) {
      console.error("Müşteriler alınırken hata:", error);
    }
  };

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
      if (selectedCustomerId) {
        queryParams.append("customerId", selectedCustomerId);
      }

      console.log(
        "🚀 API Request:",
        reportType,
        "with params:",
        queryParams.toString()
      );

      const response = await fetch(
        `/api/reports/${reportType}?${queryParams.toString()}`
      );
      if (!response.ok) throw new Error("Rapor alınamadı");

      const data = await response.json();

      setReportData(data);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [reportType, filter, selectedCustomerId]);

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

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Türkçe font desteği için
    doc.setFont("helvetica", "normal");
    doc.setLanguage("tr");

    const headers = Object.keys(reportData.data[0] || {});

    // Verileri formatla
    const data = reportData.data.map((item) => {
      return headers.map((header) => {
        const value = item[header as keyof typeof item];

        // Tarih formatlaması
        if (header.toLowerCase().includes("date") && value) {
          return new Date(value).toLocaleDateString("tr-TR");
        }

        // Para birimi formatlaması
        if (
          header.toLowerCase().includes("premium") &&
          typeof value === "number"
        ) {
          return `₺${Number(value).toLocaleString("tr-TR")}`;
        }

        // Boş değer kontrolü
        return value ?? "-";
      });
    });

    // Türkçe başlık isimleri
    const turkishHeaders = headers.map((header) => {
      const headerMap: { [key: string]: string } = {
        id: "ID",
        policyNumber: "Poliçe No",
        customerName: "Musteri Adı",
        startDate: "Başlangiç Tarihi",
        endDate: "Bitis Tarihi",
        premium: "Prim",
        policyType: "Poliçe Türü",
        status: "Durum",
      };
      return headerMap[header] || header;
    });

    autoTable(doc, {
      head: [turkishHeaders],
      body: data,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: "linebreak",
        halign: "left",
        font: "helvetica",
        fontStyle: "normal",
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
        font: "helvetica",
      },
      columnStyles: {
        0: { cellWidth: 10 }, // ID
        1: { cellWidth: 30 }, // Poliçe No
        2: { cellWidth: 35 }, // Müşteri Adı
        3: { cellWidth: 25 }, // Başlangıç Tarihi
        4: { cellWidth: 25 }, // Bitiş Tarihi
        5: { cellWidth: 20 }, // Prim
        6: { cellWidth: 25 }, // Poliçe Türü
        7: { cellWidth: 20 }, // Durum
      },
      margin: { top: 20, right: 10, bottom: 10, left: 10 },
      theme: "grid",
      didDrawPage: function () {
        doc.setFont("helvetica", "normal");
      },
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
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
                <option value="customer-accounting">
                  Müşteri Muhasebe Raporu
                </option>
              </optgroup>
            </select>
          </div>

          {/* Müşteri Seçimi - Sadece müşteri bazlı raporlarda göster */}
          {(reportType === "customer-accounting" ||
            reportType === "customer-policies") && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Müşteri Seçin
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Tüm Müşteriler</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id.toString()}>
                    {customer.name} - {customer.tcNumber}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
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
            {/* Özet Bilgiler - En üstte göster */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {reportData.summary.totalCustomers !== undefined && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-700">
                      Toplam Müşteri
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-blue-900">
                      {reportData.summary.totalCustomers}
                    </p>
                  </div>
                )}
                {reportData.summary.totalPolicies !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700">
                      Toplam Poliçe
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {reportData.summary.totalPolicies}
                    </p>
                  </div>
                )}
                {reportData.summary.totalIncome !== undefined && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-medium text-green-700">
                      Toplam Gelir
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-green-900">
                      ₺{reportData.summary.totalIncome.toLocaleString()}
                    </p>
                  </div>
                )}
                {reportData.summary.totalExpense !== undefined && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-sm font-medium text-red-700">
                      Toplam Gider
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-red-900">
                      ₺{reportData.summary.totalExpense.toLocaleString()}
                    </p>
                  </div>
                )}
                {reportData.summary.netAmount !== undefined && (
                  <div
                    className={`p-4 rounded-lg border ${
                      reportData.summary.netAmount >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <h3
                      className={`text-sm font-medium ${
                        reportData.summary.netAmount >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      Net Tutar
                    </h3>
                    <p
                      className={`mt-1 text-2xl font-semibold ${
                        reportData.summary.netAmount >= 0
                          ? "text-green-900"
                          : "text-red-900"
                      }`}
                    >
                      ₺{reportData.summary.netAmount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Müşteri Muhasebe Raporu için Özel Görünüm */}
            {reportType === "customer-accounting" ? (
              <div className="space-y-6">
                {/* Müşteri bazında grupla */}
                {(() => {
                  interface CustomerGroup {
                    customer: {
                      id: number;
                      name: string;
                      tcNumber: string;
                    };
                    transactions: CustomerAccountingReport[];
                  }

                  const groupedData = (
                    reportData.data as CustomerAccountingReport[]
                  ).reduce(
                    (
                      acc: Record<number, CustomerGroup>,
                      item: CustomerAccountingReport
                    ) => {
                      const customerId = item.customerId;
                      if (!acc[customerId]) {
                        acc[customerId] = {
                          customer: {
                            id: item.customerId,
                            name: item.customerName,
                            tcNumber: item.tcNumber,
                          },
                          transactions: [],
                        };
                      }
                      if (item.transactionId) {
                        acc[customerId].transactions.push(item);
                      }
                      return acc;
                    },
                    {}
                  );

                  return Object.values(groupedData).map(
                    (customerGroup: CustomerGroup) => (
                      <div
                        key={customerGroup.customer.id}
                        className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                      >
                        {/* Müşteri Başlığı */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {customerGroup.customer.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                TC: {customerGroup.customer.tcNumber}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                Toplam İşlem:{" "}
                                {customerGroup.transactions.length}
                              </p>
                              <p
                                className={`text-lg font-semibold ${
                                  customerGroup.transactions.reduce(
                                    (
                                      total: number,
                                      t: CustomerAccountingReport
                                    ) =>
                                      total +
                                      (t.type === "Gelir"
                                        ? t.amount
                                        : -t.amount),
                                    0
                                  ) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                ₺
                                {customerGroup.transactions
                                  .reduce(
                                    (
                                      total: number,
                                      t: CustomerAccountingReport
                                    ) =>
                                      total +
                                      (t.type === "Gelir"
                                        ? t.amount
                                        : -t.amount),
                                    0
                                  )
                                  .toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* İşlemler Tablosu */}
                        {customerGroup.transactions.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                                    Tarih
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                                    Açıklama
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                                    Poliçe No
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                                    Plaka
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                                    Tür
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                                    Tutar
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                                    Bakiye
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {customerGroup.transactions.map(
                                  (
                                    transaction: CustomerAccountingReport,
                                    idx: number
                                  ) => (
                                    <tr
                                      key={
                                        transaction.transactionId ||
                                        `transaction-${idx}`
                                      }
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(
                                          transaction.transactionDate
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900">
                                        {transaction.description}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.policyNumber || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.plateNumber || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            transaction.type === "Gelir"
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {transaction.type}
                                        </span>
                                      </td>
                                      <td
                                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                                          transaction.type === "Gelir"
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {transaction.type === "Gelir"
                                          ? "+"
                                          : "-"}
                                        ₺{transaction.amount.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                        ₺
                                        {transaction.runningBalance?.toLocaleString() ||
                                          "0"}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            Bu müşteri için işlem kaydı bulunamadı.
                          </div>
                        )}
                      </div>
                    )
                  );
                })()}
              </div>
            ) : (
              /* Diğer rapor türleri için standart tablo */
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ReportTable data={reportData.data} type={reportData.type} />
              </div>
            )}

            {/* Dışa Aktarma Butonları */}
            <div className="flex justify-end gap-4 mt-6">
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
