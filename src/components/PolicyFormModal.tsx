import { Dialog } from "@headlessui/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tr } from "date-fns/locale";
import { PolicyFormData, POLICY_TYPES, POLICY_STATUS } from "@/types/policy";
import { policyFormSchema, PolicyFormSchema } from "@/validations/policy";
import { useEffect, useState } from "react";
import { XMarkIcon, DocumentIcon } from "@heroicons/react/24/outline";

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

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
    defaultValues: {
      policyNumber: "",
      customerId: 0,
      customerName: "",
      tcNumber: "",
      plateNumber: "",
      startDate: new Date(),
      endDate: new Date(),
      premium: 0,
      policyType: "" as (typeof POLICY_TYPES)[number],
      status: "Aktif",
      description: "",
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<FileData[]>([]);

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
        plateNumber: initialData.plateNumber,
        startDate: new Date(initialData.startDate),
        endDate: new Date(initialData.endDate),
        premium: initialData.premium,
        policyType: initialData.policyType,
        status: initialData.status,
        description: initialData.description || "",
      });

      if (initialData.files) {
        setFiles(initialData.files);
      }
    } else {
      reset({
        policyNumber: "",
        customerId: 0,
        customerName: "",
        tcNumber: "",
        plateNumber: "",
        startDate: new Date(),
        endDate: new Date(),
        premium: 0,
        policyType: "" as (typeof POLICY_TYPES)[number],
        status: "Aktif",
        description: "",
      });
      setFiles([]);
    }
    setFilesToDelete([]);
  }, [initialData, reset]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setIsUploading(true);
    try {
      const newFiles: FileData[] = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Dosya yüklenemedi");
        }

        const { data } = await response.json();
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: data.name,
          size: data.size,
          type: data.type,
          url: data.url,
        });
      }

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    } catch (error) {
      console.error("Dosya yüklenirken hata:", error);
      alert("Dosya yüklenirken bir hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = (fileId: string) => {
    const fileToDelete = files.find((f) => f.id === fileId);
    if (!fileToDelete) return;

    // Dosyayı files listesinden kaldır ve filesToDelete listesine ekle
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    setFilesToDelete((prevFiles) => [...prevFiles, fileToDelete]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFormSubmit: SubmitHandler<PolicyFormSchema> = async (data) => {
    // Önce silinecek dosyaları sil
    for (const file of filesToDelete) {
      if (file.url) {
        try {
          const response = await fetch(
            `/api/upload?url=${encodeURIComponent(file.url)}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            throw new Error("Dosya silinemedi");
          }
        } catch (error) {
          console.error("Dosya silinirken hata:", error);
          alert("Dosya silinirken bir hata oluştu");
          return;
        }
      }
    }

    // Sonra formu gönder
    await onSubmit({
      ...data,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      files: files,
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
                  Plaka No
                </label>
                <input
                  type="text"
                  {...register("plateNumber")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="Opsiyonel"
                />
                {errors.plateNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.plateNumber.message}
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

            <div className="col-span-2 mt-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Dosyalar
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-white px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    {isUploading ? "Yükleniyor..." : "Dosya Seç"}
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              İndir
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleFileDelete(file.id)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
