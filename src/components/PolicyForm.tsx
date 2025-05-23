"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PolicyFormData,
  PolicyFormState,
  POLICY_TYPES,
  POLICY_STATUS,
} from "@/types/policy";

interface Customer {
  id: number;
  name: string;
  tcNumber: string;
  email: string;
  phone: string;
  address: string;
}

interface PolicyFormProps {
  onSubmit: (data: PolicyFormData) => Promise<void>;
  initialData?: PolicyFormData;
}

export default function PolicyForm({ onSubmit, initialData }: PolicyFormProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isManualCustomerEntry, setIsManualCustomerEntry] = useState(false);
  const [manualCustomerData, setManualCustomerData] = useState({
    name: "",
    tcNumber: "",
    email: "",
    phone: "",
    address: "",
  });
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    tcNumber: "",
    email: "",
    phone: "",
    address: "",
  });
  const [formData, setFormData] = useState<PolicyFormState>(
    initialData
      ? {
          ...initialData,
          startDate: new Date(initialData.startDate),
          endDate: new Date(initialData.endDate),
        }
      : {
          policyNumber: "",
          customerId: 0,
          customerName: "",
          tcNumber: "",
          plateNumber: "",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 yıl sonrası
          premium: 0,
          policyType: POLICY_TYPES[0],
          status: "Aktif",
          description: "",
        }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customerSearch.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const searchTerm = customerSearch.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.tcNumber.includes(customerSearch) ||
          customer.phone.includes(customerSearch) ||
          customer.email.toLowerCase().includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearch, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Müşteriler alınamadı");
      const data = await response.json();
      setCustomers(data.data || []);
      setFilteredCustomers(data.data || []);
    } catch (error) {
      console.error("Müşteriler alınırken hata:", error);
      setError("Müşteriler alınamadı");
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: customer.name,
      tcNumber: customer.tcNumber,
    });
    setManualCustomerData({
      name: customer.name,
      tcNumber: customer.tcNumber,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setIsManualCustomerEntry(false);
    setShowCustomerDropdown(false);
  };

  const handleNewCustomer = async () => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomerData),
      });

      if (!response.ok) throw new Error("Müşteri oluşturulamadı");

      const result = await response.json();
      const newCustomer: Customer = {
        id: result.data.id,
        ...newCustomerData,
      };

      setCustomers((prev) => [...prev, newCustomer]);
      handleCustomerSelect(newCustomer);
      setShowNewCustomerForm(false);
      setNewCustomerData({
        name: "",
        tcNumber: "",
        email: "",
        phone: "",
        address: "",
      });
    } catch (error) {
      console.error("Yeni müşteri oluşturulurken hata:", error);
      setError("Müşteri oluşturulamadı");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let customerToUse = selectedCustomer;

      // Eğer müşteri seçilmemişse ve manuel giriş modundaysa, yeni müşteri oluştur
      if (!selectedCustomer && isManualCustomerEntry) {
        if (!manualCustomerData.name || !manualCustomerData.tcNumber) {
          throw new Error("Müşteri adı ve TC kimlik numarası zorunludur");
        }

        const newCustomerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manualCustomerData),
        });

        if (!newCustomerResponse.ok) throw new Error("Müşteri oluşturulamadı");

        const result = await newCustomerResponse.json();
        customerToUse = {
          id: result.data.id,
          ...manualCustomerData,
        };

        // Yeni müşteriyi listeye ekle
        setCustomers((prev) => [...prev, customerToUse as Customer]);
      }

      if (!customerToUse) {
        throw new Error(
          "Lütfen müşteri seçiniz veya müşteri bilgilerini giriniz"
        );
      }

      // Form verilerini hazırla
      const submitData: PolicyFormData = {
        ...formData,
        customerId: customerToUse.id,
        customerName: customerToUse.name,
        tcNumber: customerToUse.tcNumber,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Form gönderilirken hata:", error);
      setError(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-sm text-red-600 hover:text-red-800 underline mt-2"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Müşteri Bilgileri
          </label>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center text-gray-900 font-medium">
              <input
                type="radio"
                name="customerMode"
                value="existing"
                checked={!isManualCustomerEntry}
                onChange={() => setIsManualCustomerEntry(false)}
                className="mr-2"
              />
              Kayıtlı Müşteri Seç
            </label>
            <label className="flex items-center text-gray-900 font-medium">
              <input
                type="radio"
                name="customerMode"
                value="manual"
                checked={isManualCustomerEntry}
                onChange={() => {
                  setIsManualCustomerEntry(true);
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                }}
                className="mr-2"
              />
              Yeni Müşteri Bilgileri Gir
            </label>
          </div>

          {!isManualCustomerEntry && (
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Ad, TC No, telefon veya e-posta ile ara..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10 text-gray-900 placeholder-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(true)}
                  className="absolute right-2 top-2 text-blue-600 hover:text-blue-800"
                  title="Yeni müşteri ekle"
                >
                  <svg
                    className="w-5 h-5"
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
                </button>
              </div>

              {showCustomerDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-gray-500 text-center">
                      <p>Müşteri bulunamadı</p>
                      <button
                        type="button"
                        onClick={() => setShowNewCustomerForm(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                      >
                        Yeni müşteri ekle
                      </button>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full text-left p-3 hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">
                          TC: {customer.tcNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.phone} • {customer.email}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {isManualCustomerEntry && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adı Soyadı *
                </label>
                <input
                  type="text"
                  value={manualCustomerData.name}
                  onChange={(e) =>
                    setManualCustomerData({
                      ...manualCustomerData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TC Kimlik No *
                </label>
                <input
                  type="text"
                  value={manualCustomerData.tcNumber}
                  onChange={(e) =>
                    setManualCustomerData({
                      ...manualCustomerData,
                      tcNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={manualCustomerData.email}
                  onChange={(e) =>
                    setManualCustomerData({
                      ...manualCustomerData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={manualCustomerData.phone}
                  onChange={(e) =>
                    setManualCustomerData({
                      ...manualCustomerData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <input
                  type="text"
                  value={manualCustomerData.address}
                  onChange={(e) =>
                    setManualCustomerData({
                      ...manualCustomerData,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>
          )}

          {!isManualCustomerEntry && selectedCustomer && (
            <div className="mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Seçilen Müşteri:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Ad:</span>
                    <span className="ml-1 text-blue-700">
                      {selectedCustomer.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">TC:</span>
                    <span className="ml-1 text-blue-700">
                      {selectedCustomer.tcNumber}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Telefon:</span>
                    <span className="ml-1 text-blue-700">
                      {selectedCustomer.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Poliçe Numarası
            </label>
            <input
              type="text"
              value={formData.policyNumber}
              onChange={(e) =>
                setFormData({ ...formData, policyNumber: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Plaka Numarası
            </label>
            <input
              type="text"
              value={formData.plateNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, plateNumber: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="Plaka numarası (opsiyonel)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Poliçe Türü
            </label>
            <select
              value={formData.policyType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  policyType: e.target.value as (typeof POLICY_TYPES)[number],
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              required
            >
              {POLICY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Başlangıç Tarihi
            </label>
            <DatePicker
              selected={formData.startDate}
              onChange={(date: Date | null) =>
                date && setFormData({ ...formData, startDate: date })
              }
              dateFormat="dd/MM/yyyy"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Bitiş Tarihi
            </label>
            <DatePicker
              selected={formData.endDate}
              onChange={(date: Date | null) =>
                date && setFormData({ ...formData, endDate: date })
              }
              dateFormat="dd/MM/yyyy"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prim Tutarı
            </label>
            <input
              type="number"
              value={formData.premium}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  premium: parseFloat(e.target.value),
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Durum
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as (typeof POLICY_STATUS)[number],
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              required
            >
              {POLICY_STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>

      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Yeni Müşteri Ekle
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(false)}
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Adı Soyadı
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.name}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    TC Kimlik No
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.tcNumber}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        tcNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={newCustomerData.email}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.phone}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Adres
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.address}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleNewCustomer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(false)}
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

      {showCustomerDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowCustomerDropdown(false)}
        />
      )}
    </div>
  );
}
