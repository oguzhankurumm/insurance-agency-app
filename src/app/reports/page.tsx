"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
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
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // Debounce effect for search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      if (debouncedSearchTerm.trim()) {
        queryParams.append("customerName", debouncedSearchTerm.trim());
      }
      if (selectedCustomerId) {
        queryParams.append("customerId", selectedCustomerId);
      }

      console.log(
        "🚀 API Request:",
        reportType,
        "with params:",
        queryParams.toString(),
        "selectedCustomerId:",
        selectedCustomerId
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
  }, [reportType, filter, selectedCustomerId, debouncedSearchTerm]);

  useEffect(() => {
    if (reportType) {
      fetchReport();
    }
  }, [reportType, filter, fetchReport]);

  // Filtrelenmiş veriyi alma fonksiyonu
  const getFilteredData = () => {
    if (!reportData || !reportData.data) return [];

    if (reportType === "customer-accounting") {
      // Müşteri muhasebe raporu için özel filtreleme
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

      // Filtreleme uygula
      const filteredGroups = Object.values(groupedData).filter(
        (customerGroup: CustomerGroup) => {
          // Selected customer ID filtreleme
          if (
            selectedCustomerId &&
            customerGroup.customer.id.toString() !== selectedCustomerId
          ) {
            return false;
          }

          // Search term filtreleme
          if (!debouncedSearchTerm.trim()) return true;
          return customerGroup.customer.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        }
      );

      // Flat array olarak döndür
      return filteredGroups.flatMap((group) => group.transactions);
    } else {
      // Diğer rapor türleri için filtreleme
      let filteredData = reportData.data;

      // Selected customer ID filtreleme
      if (selectedCustomerId) {
        filteredData = filteredData.filter((item) => {
          const customerId = (item as { customerId?: number }).customerId;
          return customerId && customerId.toString() === selectedCustomerId;
        });
      }

      // Search term filtreleme
      if (debouncedSearchTerm.trim()) {
        filteredData = filteredData.filter((item) => {
          const customerName =
            (item as { customerName?: string }).customerName || "";
          return customerName
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        });
      }

      return filteredData;
    }
  };

  const handleExportExcel = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    // İlk veri örneğinden kolonları al
    const firstItem = filteredData[0];
    const headers = Object.keys(firstItem);

    // Türkçe başlık çevirileri
    const headerTranslations: { [key: string]: string } = {
      id: "ID",
      policyNumber: "Poliçe No",
      customerName: "Müşteri Adı",
      startDate: "Başlangıç Tarihi",
      endDate: "Bitiş Tarihi",
      premium: "Prim (₺)",
      policyType: "Poliçe Türü",
      status: "Durum",
      description: "Açıklama",
      plateNumber: "Plaka No",
      tcNumber: "TC No",
      phone: "Telefon",
      email: "E-posta",
      address: "Adres",
      amount: "Tutar (₺)",
      type: "Tür",
      transactionDate: "İşlem Tarihi",
      customerId: "Müşteri ID",
      month: "Ay",
      year: "Yıl",
      income: "Gelir (₺)",
      expense: "Gider (₺)",
      netAmount: "Net Tutar (₺)",
      policyCount: "Poliçe Sayısı",
      daysUntilExpiry: "Kalan Gün",
      daysPastDue: "Geciken Gün",
      dueDate: "Vade Tarihi",
      totalBalance: "Toplam Bakiye",
      activePolicies: "Aktif Poliçeler",
      totalPremium: "Toplam Prim",
      lastPolicyDate: "Son Poliçe Tarihi",
      runningBalance: "Güncel Bakiye",
      transactionId: "İşlem ID",
    };

    // Başlıkları çevir
    const translatedHeaders = headers.map(
      (header) => headerTranslations[header] || header
    );

    // Veriyi formatla
    const excelData = filteredData.map((item) => {
      const formattedRow: { [key: string]: string | number | undefined } = {};

      headers.forEach((header, index) => {
        const value = (item as unknown as Record<string, unknown>)[header];
        const translatedHeader = translatedHeaders[index];

        if (value === null || value === undefined) {
          formattedRow[translatedHeader] = "-";
          return;
        }

        // Tarih formatlaması
        if (header.toLowerCase().includes("date") && value) {
          try {
            formattedRow[translatedHeader] = new Date(
              value as string
            ).toLocaleDateString("tr-TR");
          } catch {
            formattedRow[translatedHeader] = String(value);
          }
          return;
        }

        // Para formatlaması
        if (
          (header.toLowerCase().includes("premium") ||
            header.toLowerCase().includes("amount") ||
            header.toLowerCase().includes("income") ||
            header.toLowerCase().includes("expense")) &&
          typeof value === "number"
        ) {
          formattedRow[translatedHeader] = value;
          return;
        }

        formattedRow[translatedHeader] = value as string | number;
      });

      return formattedRow;
    });

    // Rapor türü çevirisi
    const reportTypeTranslations: { [key: string]: string } = {
      "active-policies": "Aktif_Policeler",
      "expiring-policies": "Vadesi_Yaklasan_Policeler",
      "customer-policies": "Musteri_Bazli_Policeler",
      monthly: "Aylik_Gelir_Gider",
      yearly: "Yillik_Gelir_Gider",
      "customer-accounting": "Musteri_Muhasebe",
    };

    const reportTitle = reportTypeTranslations[reportType] || reportType;

    // Excel dosyası oluştur
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");

    // Dosyayı indir
    const fileName = `${reportTitle}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPDF = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Başlık ekle
    const reportTypeTranslations: { [key: string]: string } = {
      "active-policies": "Aktif Policeler",
      "expiring-policies": "Vadesi Yaklasan Policeler",
      "customer-policies": "Musteri Bazli Policeler",
      monthly: "Aylik Gelir-Gider",
      yearly: "Yillik Gelir-Gider",
      "customer-accounting": "Musteri Muhasebe",
    };

    const reportTitle =
      reportTypeTranslations[reportType] || reportType.toUpperCase();

    doc.setFontSize(16);
    doc.text(`${reportTitle} RAPORU`, 20, 20);
    doc.setFontSize(10);
    doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 20, 30);

    // İlk veri örneğinden kolonları al
    const firstItem = filteredData[0];
    const headers = Object.keys(firstItem);

    // ASCII-safe başlık çevirileri
    const headerTranslations: { [key: string]: string } = {
      id: "ID",
      policyNumber: "Police No",
      customerName: "Musteri Adi",
      startDate: "Baslangic Tarihi",
      endDate: "Bitis Tarihi",
      premium: "Prim (TL)",
      policyType: "Police Turu",
      status: "Durum",
      description: "Aciklama",
      plateNumber: "Plaka No",
      tcNumber: "TC No",
      phone: "Telefon",
      email: "E-posta",
      address: "Adres",
      amount: "Tutar (TL)",
      type: "Tur",
      transactionDate: "Islem Tarihi",
      customerId: "Musteri ID",
      month: "Ay",
      year: "Yil",
      income: "Gelir (TL)",
      expense: "Gider (TL)",
      netAmount: "Net Tutar (TL)",
      policyCount: "Police Sayisi",
      daysUntilExpiry: "Kalan Gun",
      daysPastDue: "Geciken Gun",
      dueDate: "Vade Tarihi",
      totalBalance: "Toplam Bakiye",
      activePolicies: "Aktif Policeler",
      totalPremium: "Toplam Prim",
      lastPolicyDate: "Son Police Tarihi",
      runningBalance: "Guncel Bakiye",
      transactionId: "Islem ID",
    };

    // Başlıkları çevir
    const translatedHeaders = headers.map(
      (header) =>
        headerTranslations[header] ||
        header.replace(/[çÇğĞıIİöÖşŞüÜ]/g, function (match) {
          const replacements: { [key: string]: string } = {
            ç: "c",
            Ç: "C",
            ğ: "g",
            Ğ: "G",
            ı: "i",
            I: "I",
            İ: "I",
            ö: "o",
            Ö: "O",
            ş: "s",
            Ş: "S",
            ü: "u",
            Ü: "U",
          };
          return replacements[match] || match;
        })
    );

    // Veriyi temizle ve formatla
    const tableData = filteredData.map((item) => {
      return headers.map((header) => {
        const value = (item as unknown as Record<string, unknown>)[header];

        if (value === null || value === undefined) {
          return "-";
        }

        // Tarih formatlaması
        if (header.toLowerCase().includes("date") && value) {
          try {
            return new Date(value as string).toLocaleDateString("tr-TR");
          } catch {
            return String(value);
          }
        }

        // Para formatlaması
        if (
          (header.toLowerCase().includes("premium") ||
            header.toLowerCase().includes("amount") ||
            header.toLowerCase().includes("income") ||
            header.toLowerCase().includes("expense")) &&
          typeof value === "number"
        ) {
          return (value as number).toLocaleString("tr-TR");
        }

        // String değerleri ASCII'ye çevir
        if (typeof value === "string") {
          return (value as string).replace(
            /[çÇğĞıIİöÖşŞüÜ]/g,
            (match: string) => {
              const replacements: { [key: string]: string } = {
                ç: "c",
                Ç: "C",
                ğ: "g",
                Ğ: "G",
                ı: "i",
                I: "I",
                İ: "I",
                ö: "o",
                Ö: "O",
                ş: "s",
                Ş: "S",
                ü: "u",
                Ü: "U",
              };
              return replacements[match] || match;
            }
          );
        }

        return String(value);
      });
    });

    // AutoTable ile tablo oluştur
    autoTable(doc, {
      head: [translatedHeaders],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 7,
        cellPadding: 1,
        overflow: "linebreak",
        halign: "left",
        font: "helvetica",
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {},
      margin: { top: 40, right: 10, bottom: 10, left: 10 },
      theme: "striped",
      tableWidth: "auto",
      showHead: "everyPage",
    });

    // Dosyayı kaydet
    const fileName = `${reportType}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Müşteri Adı Ara
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Müşteri adı ile ara..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 pl-10 pr-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
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

                  // Search term ve selected customer ile müşteri filtreleme
                  const filteredData = Object.values(groupedData).filter(
                    (customerGroup: CustomerGroup) => {
                      // Selected customer ID filtreleme
                      if (
                        selectedCustomerId &&
                        customerGroup.customer.id.toString() !==
                          selectedCustomerId
                      ) {
                        return false;
                      }

                      // Search term filtreleme
                      if (!debouncedSearchTerm.trim()) return true;
                      return customerGroup.customer.name
                        .toLowerCase()
                        .includes(debouncedSearchTerm.toLowerCase());
                    }
                  );

                  return filteredData.map((customerGroup: CustomerGroup) => (
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
                              Toplam İşlem: {customerGroup.transactions.length}
                            </p>
                            <p
                              className={`text-lg font-semibold ${
                                customerGroup.transactions.reduce(
                                  (
                                    total: number,
                                    t: CustomerAccountingReport
                                  ) =>
                                    total +
                                    (t.type === "Gelir" ? t.amount : -t.amount),
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
                                    (t.type === "Gelir" ? t.amount : -t.amount),
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
                                      {transaction.type === "Gelir" ? "+" : "-"}
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
                  ));
                })()}
              </div>
            ) : (
              /* Diğer rapor türleri için standart tablo */
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ReportTable data={getFilteredData()} type={reportData.type} />
              </div>
            )}

            {/* Dışa Aktarma Butonları */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Excel İndir
              </button>
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
