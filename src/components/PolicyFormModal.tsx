import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tr } from "date-fns/locale";
import { PolicyFormData, POLICY_TYPES, POLICY_STATUS } from "@/types/policy";
import { policyFormSchema, PolicyFormSchema } from "@/validations/policy";
import { useEffect, useState } from "react";

interface Customer {
  id: number;
  name: string;
}

interface PolicyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PolicyFormData) => Promise<void>;
  initialData?: PolicyFormData;
}

export default function PolicyFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: PolicyFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PolicyFormSchema>({
    resolver: yupResolver(policyFormSchema),
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true);
        setCustomerError(null);
        const response = await fetch("/api/customers");
        if (!response.ok) {
          throw new Error("Müşteriler alınamadı");
        }
        const data = await response.json();
        setCustomers(data.data || []);
      } catch (error) {
        console.error("Müşteriler yüklenirken hata:", error);
        setCustomerError("Müşteriler yüklenirken bir hata oluştu");
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        policyNumber: initialData.policyNumber,
        customerId: initialData.customerId,
        customerName: initialData.customerName,
        tcNumber: initialData.tcNumber,
        startDate: new Date(initialData.startDate),
        endDate: new Date(initialData.endDate),
        premium: initialData.premium,
        policyType: initialData.policyType,
        status: initialData.status,
        description: initialData.description || "",
      });
    } else {
      reset({
        policyNumber: "",
        customerId: 0,
        customerName: "",
        tcNumber: "",
        startDate: new Date(),
        endDate: new Date(),
        premium: 0,
        policyType: "" as (typeof POLICY_TYPES)[number],
        status: "Aktif",
        description: "",
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: PolicyFormSchema) => {
    await onSubmit({
      ...data,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6">
              {initialData ? "Poliçe Düzenle" : "Yeni Poliçe Ekle"}
            </Dialog.Title>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Poliçe No
                </label>
                <input
                  type="text"
                  {...register("policyNumber")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
                {errors.policyNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.policyNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Müşteri
                </label>
                <select
                  {...register("customerId", {
                    onChange: (e) => {
                      const selectedCustomer = customers.find(
                        (c) => c.id === Number(e.target.value)
                      );
                      if (selectedCustomer) {
                        setValue("customerName", selectedCustomer.name);
                      }
                    },
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  disabled={isLoadingCustomers}
                >
                  <option value="">Seçiniz</option>
                  {!isLoadingCustomers &&
                    !customerError &&
                    customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                </select>
                {isLoadingCustomers && (
                  <p className="mt-1 text-sm text-gray-500">
                    Müşteriler yükleniyor...
                  </p>
                )}
                {customerError && (
                  <p className="mt-1 text-sm text-red-600">{customerError}</p>
                )}
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customerId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  TC No
                </label>
                <input
                  type="text"
                  {...register("tcNumber")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
                {errors.tcNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.tcNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Prim
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("premium")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
                {errors.premium && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.premium.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Başlangıç Tarihi
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setValue("startDate", date as Date)}
                  locale={tr}
                  dateFormat="dd/MM/yyyy"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Bitiş Tarihi
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setValue("endDate", date as Date)}
                  locale={tr}
                  dateFormat="dd/MM/yyyy"
                  minDate={startDate}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Poliçe Türü
                </label>
                <select
                  {...register("policyType")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Seçiniz</option>
                  {POLICY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.policyType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.policyType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Durum
                </label>
                <select
                  {...register("status")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Seçiniz</option>
                  {POLICY_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Açıklama
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
