"use client";

import { useState, useEffect } from "react";

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

interface Policy {
  id: number;
  policyNumber: string;
  plateNumber?: string;
  startDate: string;
  endDate: string;
  premium: number;
  status: "Aktif" | "Pasif" | "İptal";
  policyType: string;
}

interface AccountingRecord {
  id: number;
  transactionDate: string;
  amount: number;
  type: "Gelir" | "Gider";
  description: string;
}

interface CustomerWithDetails extends Customer {
  policies?: Policy[];
  accountingRecords?: AccountingRecord[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string>("");
  const [deleteWithPolicies, setDeleteWithPolicies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    tcNumber: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      // Arama terimi yoksa tüm müşterileri alfabetik sırala
      const sortedCustomers = [...customers].sort((a, b) =>
        a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
      );
      setFilteredCustomers(sortedCustomers);
    } else {
      // Arama terimi varsa filtreleme yap ve sonucu alfabetik sırala
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.tcNumber.includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm)
      );
      const sortedFiltered = filtered.sort((a, b) =>
        a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
      );
      setFilteredCustomers(sortedFiltered);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers");
      const result = await response.json();
      if (result.data) {
        setCustomers(result.data);
      }
    } catch (error) {
      console.error("Müşteriler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: number) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      const result = await response.json();
      if (result.data) {
        // Muhasebe kayıtlarını da al
        const accountingResponse = await fetch(
          `/api/accounting?customerId=${customerId}`
        );
        const accountingResult = await accountingResponse.json();

        setSelectedCustomer({
          ...result.data,
          accountingRecords: accountingResult.data || [],
        });
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error("Müşteri detayları yüklenirken hata:", error);
    }
  };

  const handleAddCustomer = async () => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          tcNumber: "",
          email: "",
          phone: "",
          address: "",
        });
        fetchCustomers();
      }
    } catch (error) {
      console.error("Müşteri eklenirken hata:", error);
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        setFormData({
          name: "",
          tcNumber: "",
          email: "",
          phone: "",
          address: "",
        });
        setSelectedCustomer(null);
        fetchCustomers();
      }
    } catch (error) {
      console.error("Müşteri güncellenirken hata:", error);
    }
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      tcNumber: customer.tcNumber,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteError("");
    setDeleteWithPolicies(false);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      // Eğer poliçelerle birlikte silme seçilmişse, önce poliçeleri sil
      if (deleteWithPolicies) {
        // Müşterinin poliçelerini al
        const customerResponse = await fetch(
          `/api/customers/${customerToDelete.id}`
        );
        const customerResult = await customerResponse.json();

        if (customerResult.data && customerResult.data.policies) {
          // Her poliçeyi tek tek sil
          for (const policy of customerResult.data.policies) {
            await fetch(`/api/policies/${policy.id}`, {
              method: "DELETE",
            });
          }
        }
      }

      // Müşteriyi sil
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
        setDeleteError("");
        setDeleteWithPolicies(false);
        fetchCustomers();
      } else {
        // Hata durumunda kullanıcıya mesaj göster
        setDeleteError(result.error || "Müşteri silinirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Müşteri silinirken hata:", error);
      setDeleteError("Müşteri silinirken bir hata oluştu");
    }
  };

  const calculateCustomerBalance = (accountingRecords: AccountingRecord[]) => {
    return accountingRecords.reduce((total, record) => {
      return record.type === "Gelir"
        ? total + record.amount
        : total - record.amount;
    }, 0);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Müşteri Yönetimi
            </h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Yeni Müşteri
            </button>
          </div>
        </div>

        {/* Arama */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-3 h-5 w-5 text-gray-400"
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
            <input
              type="text"
              placeholder="Ad, TC No, E-posta veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-900"
            />
          </div>
        </div>

        {/* Müşteri Listesi */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center text-gray-500">Yükleniyor...</div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center text-gray-500">
                {searchTerm
                  ? "Arama sonucu bulunamadı"
                  : "Henüz müşteri kaydı yok"}
              </div>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        TC: {customer.tcNumber}
                      </p>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => fetchCustomerDetails(customer.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Detay
                    </button>
                    <button
                      onClick={() => openEditModal(customer)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Düzenle
                    </button>
                    <button
                      onClick={() => openDeleteModal(customer)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Müşteri Ekleme Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Yeni Müşteri Ekle
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Adı Soyadı
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Müşteri adı soyadı"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="tcNumber"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      TC Kimlik No
                    </label>
                    <input
                      type="text"
                      id="tcNumber"
                      value={formData.tcNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, tcNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="TC Kimlik Numarası"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      E-posta
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="E-posta adresi"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Telefon
                    </label>
                    <input
                      type="text"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Telefon numarası"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Adres
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Adres"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddCustomer}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Müşteri Detay Modal */}
        {isDetailModalOpen && selectedCustomer && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Müşteri Detayları
                  </h2>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
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

                <div className="space-y-8">
                  {/* Müşteri Bilgileri */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Müşteri Bilgileri
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-900">
                          Adı Soyadı
                        </label>
                        <p className="mt-1 text-sm text-gray-900 font-medium">
                          {selectedCustomer.name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900">
                          TC Kimlik No
                        </label>
                        <p className="mt-1 text-sm text-gray-900 font-medium">
                          {selectedCustomer.tcNumber}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900">
                          E-posta
                        </label>
                        <p className="mt-1 text-sm text-gray-900 font-medium">
                          {selectedCustomer.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900">
                          Telefon
                        </label>
                        <p className="mt-1 text-sm text-gray-900 font-medium">
                          {selectedCustomer.phone}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-900">
                          Adres
                        </label>
                        <p className="mt-1 text-sm text-gray-900 font-medium">
                          {selectedCustomer.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Poliçeler */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Poliçeler
                    </h3>
                    {selectedCustomer.policies &&
                    selectedCustomer.policies.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCustomer.policies.map((policy) => (
                          <div
                            key={policy.id}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <svg
                                    className="w-4 h-4 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <span className="font-medium text-gray-900">
                                    {policy.policyNumber}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      policy.status === "Aktif"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {policy.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {policy.policyType} - {policy.plateNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    policy.startDate
                                  ).toLocaleDateString()}{" "}
                                  -{" "}
                                  {new Date(
                                    policy.endDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  ₺{policy.premium.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                        Bu müşteriye ait poliçe bulunmuyor.
                      </p>
                    )}
                  </div>

                  {/* Muhasebe Kayıtları */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Muhasebe Kayıtları
                    </h3>
                    {selectedCustomer.accountingRecords &&
                    selectedCustomer.accountingRecords.length > 0 ? (
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Toplam Bakiye</p>
                          <p
                            className={`text-2xl font-bold ${getBalanceColor(
                              calculateCustomerBalance(
                                selectedCustomer.accountingRecords
                              )
                            )}`}
                          >
                            ₺
                            {calculateCustomerBalance(
                              selectedCustomer.accountingRecords
                            ).toLocaleString()}
                          </p>
                        </div>
                        {selectedCustomer.accountingRecords.map((record) => (
                          <div
                            key={record.id}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {record.description}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    record.transactionDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-semibold ${
                                    record.type === "Gelir"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {record.type === "Gelir" ? "+" : "-"}₺
                                  {record.amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {record.type}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                        Bu müşteriye ait muhasebe kaydı bulunmuyor.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Müşteri Silme Onay Modal */}
        {isDeleteModalOpen && customerToDelete && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <svg
                    className="w-6 h-6 text-red-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-900">
                    Müşteriyi Sil
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  <strong>{customerToDelete.name}</strong> isimli müşteriyi
                  silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>

                {/* Poliçelerle birlikte silme seçeneği */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deleteWithPolicies}
                      onChange={(e) => setDeleteWithPolicies(e.target.checked)}
                      className="mr-2 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">
                      Bu müşteriye ait tüm poliçeleri de sil
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Bu seçenek işaretlenirse, müşteriye bağlı tüm poliçeler de
                    silinecektir.
                  </p>
                </div>

                {deleteError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {deleteError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCustomer}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    Sil
                  </button>
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setCustomerToDelete(null);
                      setDeleteError("");
                      setDeleteWithPolicies(false);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Müşteri Düzenleme Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Müşteri Düzenle
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Adı Soyadı
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Müşteri adı soyadı"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-tcNumber"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      TC Kimlik No
                    </label>
                    <input
                      type="text"
                      id="edit-tcNumber"
                      value={formData.tcNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, tcNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="TC Kimlik Numarası"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-email"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      E-posta
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="E-posta adresi"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-phone"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Telefon
                    </label>
                    <input
                      type="text"
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Telefon numarası"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-address"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Adres
                    </label>
                    <input
                      type="text"
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Adres"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleEditCustomer}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Güncelle
                    </button>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
