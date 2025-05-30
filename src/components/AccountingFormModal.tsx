import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AccountingFormData, AccountingRecord } from "@/types/accounting";

interface AccountingModalFormData {
  customerId: string;
  plateNumber?: string;
  transactionDate: Date;
  amount: number;
  type: "Gelir" | "Gider";
  description: string;
}

const schema = yup.object({
  customerId: yup.string().required("Müşteri seçimi zorunludur"),
  plateNumber: yup.string().optional(),
  transactionDate: yup.date().required("Tarih seçimi zorunludur"),
  amount: yup
    .number()
    .required("Tutar zorunludur")
    .min(0, "Tutar 0'dan büyük olmalıdır"),
  type: yup
    .string()
    .oneOf(["Gelir", "Gider"] as const)
    .required("Tür seçimi zorunludur"),
  description: yup.string().required("Açıklama zorunludur"),
}) satisfies yup.ObjectSchema<AccountingModalFormData>;

interface AccountingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccountingFormData) => void;
  initialData?: AccountingRecord | null;
  customers: { id: number; name: string; tcNumber: string }[];
}

export default function AccountingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  customers,
}: AccountingFormModalProps) {
  const defaultValues: AccountingModalFormData = initialData
    ? {
        customerId: initialData.customerId.toString(),
        plateNumber: initialData.plateNumber || "",
        transactionDate: new Date(initialData.transactionDate),
        amount: initialData.amount,
        type: initialData.type,
        description: initialData.description,
      }
    : {
        customerId: "",
        plateNumber: "",
        transactionDate: new Date(),
        amount: 0,
        type: "Gelir" as const,
        description: "",
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AccountingModalFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues,
  });

  const transactionDate = watch("transactionDate");

  const onFormSubmit = (data: AccountingModalFormData) => {
    // AccountingModalFormData'yı AccountingFormData'ya dönüştür
    const formData: AccountingFormData = {
      policyNumber: "", // Modal'da policy kullanılmıyor
      customerId: data.customerId,
      plateNumber: data.plateNumber,
      transactionDate: data.transactionDate,
      amount: data.amount,
      type: data.type,
      description: data.description,
    };
    onSubmit(formData);
    reset();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            {initialData ? "Muhasebe Kaydını Düzenle" : "Yeni Muhasebe Kaydı"}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Müşteri
              </label>
              <select
                {...register("customerId")}
                className="mt-1 block w-full rounded-md text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Müşteri Seçin</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.tcNumber})
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.customerId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plaka Numarası (Opsiyonel)
              </label>
              <input
                type="text"
                {...register("plateNumber")}
                className="mt-1 block w-full rounded-md text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Örn: 34AA34"
              />
              {errors.plateNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.plateNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tarih
              </label>
              <DatePicker
                selected={transactionDate}
                onChange={(date) => date && setValue("transactionDate", date)}
                dateFormat="dd/MM/yyyy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                wrapperClassName="w-full"
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
                className="mt-1 block w-full rounded-md text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Tutar giriniz..."
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
                className="mt-1 block w-full rounded-md text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Tür Seçin</option>
                <option value="Gelir">Gelir (+)</option>
                <option value="Gider">Gider (-)</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Açıklama
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Açıklama giriniz..."
                className="mt-1 block w-full rounded-md text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {initialData ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
