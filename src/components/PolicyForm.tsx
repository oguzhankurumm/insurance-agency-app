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
}

interface PolicyFormProps {
  onSubmit: (data: PolicyFormData) => Promise<void>;
  initialData?: PolicyFormData;
}

export default function PolicyForm({ onSubmit, initialData }: PolicyFormProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Seçili müşterinin adını al
      const selectedCustomer = customers.find(
        (c) => c.id === formData.customerId
      );
      if (!selectedCustomer) {
        throw new Error("Lütfen müşteri seçiniz");
      }

      // Form verilerini hazırla
      const submitData: PolicyFormData = {
        ...formData,
        customerName: selectedCustomer.name,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poliçe Numarası
            </label>
            <input
              type="text"
              value={formData.policyNumber}
              onChange={(e) =>
                setFormData({ ...formData, policyNumber: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri
            </label>
            <select
              value={formData.customerId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customerId: parseInt(e.target.value),
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Seçiniz</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TC Kimlik No
            </label>
            <input
              type="text"
              value={formData.tcNumber}
              onChange={(e) =>
                setFormData({ ...formData, tcNumber: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlangıç Tarihi
            </label>
            <DatePicker
              selected={formData.startDate}
              onChange={(date: Date | null) =>
                date && setFormData({ ...formData, startDate: date })
              }
              dateFormat="dd/MM/yyyy"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitiş Tarihi
            </label>
            <DatePicker
              selected={formData.endDate}
              onChange={(date: Date | null) =>
                date && setFormData({ ...formData, endDate: date })
              }
              dateFormat="dd/MM/yyyy"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
    </div>
  );
}
