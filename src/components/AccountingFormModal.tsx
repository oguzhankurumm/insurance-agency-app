import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AccountingFormData, AccountingRecord } from "@/types/accounting";

const schema = yup.object({
  policyId: yup.string().required("Poliçe seçimi zorunludur"),
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
});

interface AccountingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccountingFormData) => void;
  initialData?: AccountingRecord | null;
  policies: { id: string; policyNumber: string }[];
}

export default function AccountingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  policies,
}: AccountingFormModalProps) {
  const defaultValues = initialData
    ? {
        ...initialData,
        policyId: initialData.policyId.toString(),
        transactionDate: new Date(initialData.transactionDate),
      }
    : {
        policyId: "",
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
  } = useForm<AccountingFormData>({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const transactionDate = watch("transactionDate");

  const onFormSubmit = (data: AccountingFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            {initialData ? "Muhasebe Kaydını Düzenle" : "Yeni Muhasebe Kaydı"}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Poliçe
              </label>
              <select
                {...register("policyId")}
                className="mt-1 block w-full rounded-md text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Poliçe Seçin</option>
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policyNumber}
                  </option>
                ))}
              </select>
              {errors.policyId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.policyId.message}
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
                className="mt-1 block w-full rounded-md text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                <option value="Gelir">Gelir</option>
                <option value="Gider">Gider</option>
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
