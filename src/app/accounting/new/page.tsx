"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AccountingFormData } from "@/types/accounting";

const schema = yup.object({
  policyNumber: yup.string().required("Poliçe seçimi zorunludur"),
  transactionDate: yup.date().required("Tarih seçimi zorunludur"),
  amount: yup
    .number()
    .required("Tutar zorunludur")
    .min(0, "Tutar 0'dan büyük olmalıdır"),
  type: yup
    .string()
    .oneOf(["Gelir", "Gider"], "Tür alanı 'Gelir' veya 'Gider' olmalıdır")
    .required("Tür seçimi zorunludur"),
  description: yup.string().required("Açıklama zorunludur"),
});

interface Policy {
  id: string;
  policyNumber: string;
  customerId: string;
  plateNumber?: string;
}

export default function NewAccountingPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountingFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      transactionDate: new Date(),
    },
  });

  const transactionDate = watch("transactionDate");

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch("/api/policies");
        if (!response.ok) throw new Error("Poliçeler alınamadı");
        const data = await response.json();
        setPolicies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const onSubmit = async (data: AccountingFormData) => {
    try {
      // Policy'den customer ID'yi al
      const selectedPolicy = policies.find(
        (p) => p.policyNumber === data.policyNumber
      );
      if (!selectedPolicy) {
        throw new Error("Geçersiz poliçe seçimi");
      }

      const submissionData = {
        customerId: selectedPolicy.customerId,
        plateNumber: selectedPolicy.plateNumber,
        transactionDate: data.transactionDate.toISOString(),
        amount: data.amount,
        type: data.type,
        description: data.description,
      };

      const response = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) throw new Error("Kayıt oluşturulamadı");

      router.push("/accounting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Hata</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Yeni Muhasebe Kaydı
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Poliçe
            </label>
            <select
              {...register("policyNumber")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Poliçe Seçin</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.policyNumber}>
                  {policy.policyNumber}
                </option>
              ))}
            </select>
            {errors.policyNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.policyNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tarih
            </label>
            <DatePicker
              selected={transactionDate}
              onChange={(date: Date | null) => {
                if (date) {
                  setValue("transactionDate", date);
                }
              }}
              dateFormat="dd/MM/yyyy"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
            {errors.transactionDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.transactionDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tutar
            </label>
            <input
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tür
            </label>
            <select
              {...register("type")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tür Seçin</option>
              <option value="Gelir">Gelir</option>
              <option value="Gider">Gider</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Açıklama
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
