"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import AccountingTable from "@/components/AccountingTable";
import AccountingFormModal from "@/components/AccountingFormModal";
import type {
  AccountingRecord,
  AccountingFormData,
  CustomerAccountingSummary,
} from "@/types/accounting";

interface Customer {
  id: number;
  name: string;
  tcNumber: string;
  email: string;
  phone: string;
  address: string;
}

export default function AccountingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AccountingRecord | null>(
    null
  );
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<
    CustomerAccountingSummary[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"all" | "customer">("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
  }, []);

  useEffect(() => {
    generateCustomerSummaries();
  }, [records, customers]);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/accounting");
      if (!response.ok) throw new Error("Kayıtlar alınamadı");
      const result = await response.json();
      setRecords(result.data || []);
    } catch (error) {
      console.error("Kayıtlar alınırken hata:", error);
      setError("Kayıtlar alınamadı");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Müşteriler alınamadı");
      const data = await response.json();
      setCustomers(data.data || []);
    } catch (error) {
      console.error("Müşteriler alınırken hata:", error);
      setError("Müşteriler alınamadı");
    }
  };

  const generateCustomerSummaries = () => {
    const summaries: CustomerAccountingSummary[] = customers.map((customer) => {
      const customerTransactions = records.filter(
        (record) => record.customerId === customer.id
      );

      const totalBalance = customerTransactions.reduce((total, record) => {
        return record.type === "Gelir"
          ? total + record.amount
          : total - record.amount;
      }, 0);

      // Plaka bazında gruplandır
      const plateGroups: { [key: string]: AccountingRecord[] } = {};
      customerTransactions.forEach((transaction) => {
        const plateKey = transaction.plateNumber || "Plakasız";
        if (!plateGroups[plateKey]) {
          plateGroups[plateKey] = [];
        }
        plateGroups[plateKey].push(transaction);
      });

      const plateTransactions = Object.entries(plateGroups).map(
        ([plateNumber, transactions]) => {
          const balance = transactions.reduce((total, record) => {
            return record.type === "Gelir"
              ? total + record.amount
              : total - record.amount;
          }, 0);
          return {
            plateNumber,
            transactions,
            balance,
          };
        }
      );

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          tcNumber: customer.tcNumber,
          phone: customer.phone,
        },
        totalBalance,
        status: totalBalance === 0 ? "Deaktif" : "Aktif",
        plateTransactions,
      };
    });

    setCustomerSummaries(summaries);
  };

  // Tüm kayıtlar için özet hesapla
  const generateAllRecordsSummary = () => {
    const totalIncome = records
      .filter((record) => record.type === "Gelir")
      .reduce((total, record) => total + record.amount, 0);

    const totalExpense = records
      .filter((record) => record.type === "Gider")
      .reduce((total, record) => total + record.amount, 0);

    const netBalance = totalIncome - totalExpense;

    const activeCustomers = customerSummaries.filter(
      (summary) => summary.status === "Aktif"
    ).length;
    const inactiveCustomers = customerSummaries.filter(
      (summary) => summary.status === "Deaktif"
    ).length;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      totalTransactions: records.length,
      activeCustomers,
      inactiveCustomers,
      totalCustomers: customers.length,
    };
  };

  const handleSubmit = async (data: AccountingFormData) => {
    try {
      const url = selectedRecord
        ? `/api/accounting/${selectedRecord.id}`
        : "/api/accounting";
      const method = selectedRecord ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          transactionDate: data.transactionDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "İşlem başarısız");
      }

      await fetchRecords();
      setIsModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Kayıt işlemi sırasında hata:", error);
      setError(error instanceof Error ? error.message : "Bir hata oluştu");
    }
  };

  const handleEdit = (record: AccountingRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (record: AccountingRecord) => {
    if (!window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/accounting/${record.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Silme işlemi başarısız");
      }

      await fetchRecords();
    } catch (error) {
      console.error("Kayıt silinirken hata:", error);
      setError(
        error instanceof Error ? error.message : "Silme işlemi başarısız"
      );
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const filteredRecords =
    searchType === "all"
      ? records.filter((record) => {
          if (!searchTerm) return true;
          return (
            record.customerName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            record.tcNumber?.includes(searchTerm) ||
            record.plateNumber
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            record.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
      : [];

  const filteredCustomerSummaries =
    searchType === "customer"
      ? customerSummaries.filter((summary) => {
          if (!searchTerm) return true;
          return (
            summary.customer.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            summary.customer.tcNumber.includes(searchTerm)
          );
        })
      : customerSummaries;

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchRecords();
            fetchCustomers();
          }}
          className="mt-2 text-blue-500 hover:text-blue-700"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Muhasebe Kayıtları
          </h1>
          <button
            onClick={() => {
              setSelectedRecord(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Yeni Kayıt
          </button>
        </div>

        {/* Arama ve Görünüm Seçenekleri */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-4">
              <label className="flex items-center text-gray-900 font-medium">
                <input
                  type="radio"
                  name="searchType"
                  value="customer"
                  checked={searchType === "customer"}
                  onChange={(e) =>
                    setSearchType(e.target.value as "all" | "customer")
                  }
                  className="mr-2"
                />
                Müşteri Bazlı
              </label>
              <label className="flex items-center text-gray-900 font-medium">
                <input
                  type="radio"
                  name="searchType"
                  value="all"
                  checked={searchType === "all"}
                  onChange={(e) =>
                    setSearchType(e.target.value as "all" | "customer")
                  }
                  className="mr-2"
                />
                Tüm Kayıtlar
              </label>
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder={
                  searchType === "customer"
                    ? "Müşteri adı veya TC No ile ara..."
                    : "Müşteri adı, TC No, plaka veya açıklama ile ara..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* İçerik */}
        {searchType === "customer" ? (
          <div className="space-y-4">
            {filteredCustomerSummaries.map((summary) => (
              <div
                key={summary.customer.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {summary.customer.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          summary.status === "Aktif"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {summary.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      TC: {summary.customer.tcNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {summary.customer.phone}
                    </p>

                    {/* Plaka bazında işlemler */}
                    {summary.plateTransactions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Plaka Bazında Bakiyeler:
                        </p>
                        <div className="space-y-1">
                          {summary.plateTransactions
                            .slice(0, 3)
                            .map((plateTransaction, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-gray-600">
                                  {plateTransaction.plateNumber}:
                                </span>
                                <span
                                  className={`ml-2 font-medium ${
                                    plateTransaction.balance > 0
                                      ? "text-green-600"
                                      : plateTransaction.balance < 0
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {plateTransaction.balance > 0 ? "+" : ""}₺
                                  {plateTransaction.balance.toLocaleString(
                                    "tr-TR"
                                  )}
                                  {plateTransaction.balance > 0
                                    ? " alacak"
                                    : plateTransaction.balance < 0
                                    ? " borç"
                                    : " (sıfır)"}
                                </span>
                              </div>
                            ))}
                          {summary.plateTransactions.length > 3 && (
                            <div className="text-sm text-gray-500">
                              ve {summary.plateTransactions.length - 3} plaka
                              daha...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Toplam Bakiye</p>
                      <p
                        className={`text-2xl font-bold ${getBalanceColor(
                          summary.totalBalance
                        )}`}
                      >
                        {summary.totalBalance > 0 ? "+" : ""}₺
                        {summary.totalBalance.toLocaleString("tr-TR")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {summary.totalBalance > 0
                          ? "Alacak"
                          : summary.totalBalance < 0
                          ? "Borç"
                          : "Bakiye Sıfır"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleCustomerSelect(summary.customer as Customer)
                      }
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm"
                    >
                      Detay Görüntüle
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredCustomerSummaries.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center text-gray-500">
                  {searchTerm
                    ? "Arama sonucu bulunamadı"
                    : "Müşteri bulunamadı"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Özet Kartları */}
            {(() => {
              const summary = generateAllRecordsSummary();
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Toplam Alacak */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          Toplam Alacak
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          +₺{summary.totalIncome.toLocaleString("tr-TR")}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Gelir işlemleri
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 11l5-5m0 0l5 5m-5-5v12"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toplam Borç */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          Toplam Borç
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          -₺{summary.totalExpense.toLocaleString("tr-TR")}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Gider işlemleri
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 13l-5 5m0 0l-5-5m5 5V6"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Bakiye */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          Net Bakiye
                        </p>
                        <p
                          className={`text-2xl font-bold ${getBalanceColor(
                            summary.netBalance
                          )}`}
                        >
                          {summary.netBalance > 0 ? "+" : ""}₺
                          {summary.netBalance.toLocaleString("tr-TR")}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {summary.netBalance > 0
                            ? "Kâr"
                            : summary.netBalance < 0
                            ? "Zarar"
                            : "Denge"}
                        </p>
                      </div>
                      <div className="ml-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            summary.netBalance > 0
                              ? "bg-green-100"
                              : summary.netBalance < 0
                              ? "bg-red-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 ${
                              summary.netBalance > 0
                                ? "text-green-600"
                                : summary.netBalance < 0
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* İşlem ve Müşteri Sayıları */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          İstatistikler
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {summary.totalTransactions}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Toplam işlem
                        </p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-green-600">
                            {summary.activeCustomers} aktif
                          </span>
                          <span className="text-gray-500">
                            {summary.inactiveCustomers} deaktif
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <AccountingTable
              records={filteredRecords}
              onEdit={handleEdit}
              onDelete={handleDelete}
              customers={customers}
            />
          </div>
        )}

        {/* Müşteri Detay Modal */}
        {showCustomerDetail && selectedCustomer && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCustomer.name} - Muhasebe Detayı
                  </h2>
                  <button
                    onClick={() => setShowCustomerDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
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
                </div>

                {(() => {
                  const customerSummary = customerSummaries.find(
                    (s) => s.customer.id === selectedCustomer.id
                  );
                  if (!customerSummary) return null;

                  return (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Toplam Bakiye</p>
                          <p
                            className={`text-3xl font-bold ${getBalanceColor(
                              customerSummary.totalBalance
                            )}`}
                          >
                            {customerSummary.totalBalance > 0 ? "+" : ""}₺
                            {customerSummary.totalBalance.toLocaleString(
                              "tr-TR"
                            )}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Durum: {customerSummary.status}
                          </p>
                        </div>
                      </div>

                      {/* Plaka bazında detaylı görünüm */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Plaka Bazında İşlemler
                        </h3>
                        {customerSummary.plateTransactions.map(
                          (plateTransaction, idx) => (
                            <div
                              key={idx}
                              className="mb-6 border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-gray-900">
                                  {plateTransaction.plateNumber}
                                </h4>
                                <span
                                  className={`font-medium ${getBalanceColor(
                                    plateTransaction.balance
                                  )}`}
                                >
                                  {plateTransaction.balance > 0 ? "+" : ""}₺
                                  {plateTransaction.balance.toLocaleString(
                                    "tr-TR"
                                  )}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {plateTransaction.transactions.map(
                                  (transaction) => (
                                    <div
                                      key={transaction.id}
                                      className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {transaction.description}
                                        </p>
                                        <p className="text-gray-600">
                                          {new Date(
                                            transaction.transactionDate
                                          ).toLocaleDateString("tr-TR")}
                                        </p>
                                      </div>
                                      <span
                                        className={`font-medium ${
                                          transaction.type === "Gelir"
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {transaction.type === "Gelir"
                                          ? "+"
                                          : "-"}
                                        ₺
                                        {transaction.amount.toLocaleString(
                                          "tr-TR"
                                        )}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        )}

                        {customerSummary.plateTransactions.length === 0 && (
                          <p className="text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
                            Bu müşteriye ait muhasebe kaydı bulunmuyor.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <AccountingFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedRecord}
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            tcNumber: c.tcNumber,
          }))}
        />
      </div>
    </div>
  );
}
