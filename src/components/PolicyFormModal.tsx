import { Dialog, Combobox } from "@headlessui/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tr } from "date-fns/locale";
import { PolicyFormData, POLICY_TYPES, POLICY_STATUS } from "@/types/policy";
import { policyFormSchema, PolicyFormSchema } from "@/validations/policy";
import { useEffect, useState } from "react";
import {
  XMarkIcon,
  DocumentIcon,
  ChevronUpDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

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
  tcNumber: string;
  email: string;
  phone: string;
  address: string;
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
  const watchedTcNumber = watch("tcNumber");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerQuery, setCustomerQuery] = useState("");
  const [isManualCustomerEntry, setIsManualCustomerEntry] = useState(false);
  const [manualCustomerData, setManualCustomerData] = useState({
    name: "",
    tcNumber: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<FileData[]>([]);

  // Filtered customers for search
  const filteredCustomers =
    customerQuery === ""
      ? customers.sort((a, b) =>
          a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
        )
      : customers
          .filter((customer) => {
            const searchTerm = customerQuery.toLowerCase();
            return (
              customer.name?.toLowerCase().includes(searchTerm) ||
              customer.tcNumber?.includes(customerQuery) ||
              customer.phone?.includes(customerQuery) ||
              customer.email?.toLowerCase().includes(searchTerm)
            );
          })
          .sort((a, b) =>
            a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
          );

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

      // Düzenleme modunda mevcut müşteriyi dropdown'da seçili göster
      if (initialData.customerId && customers.length > 0) {
        const currentCustomer = customers.find(
          (c) => c.id === initialData.customerId
        );
        if (currentCustomer) {
          setSelectedCustomer(currentCustomer);
        }
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
  }, [initialData, reset, customers]);

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
    console.log("Form submit başladı");
    console.log("Form data:", data);
    console.log("Manual customer entry:", isManualCustomerEntry);
    console.log("Manual customer data:", manualCustomerData);

    try {
      let customerToUse: Customer | null = null;

      // Eğer müşteri seçilmemişse ve manuel giriş modundaysa, yeni müşteri oluştur
      if (!data.customerId && isManualCustomerEntry) {
        console.log("Yeni müşteri oluşturuluyor...");

        if (!manualCustomerData.name || !manualCustomerData.tcNumber) {
          console.log("Eksik bilgi hatası:", {
            name: manualCustomerData.name,
            tcNumber: manualCustomerData.tcNumber,
          });
          alert("Müşteri adı ve TC kimlik numarası zorunludur");
          return;
        }

        console.log("Müşteri API'ye gönderiliyor:", manualCustomerData);

        const newCustomerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manualCustomerData),
        });

        if (!newCustomerResponse.ok) {
          console.log("Müşteri oluşturma hatası:", newCustomerResponse.status);
          alert("Müşteri oluşturulamadı");
          return;
        }

        const result = await newCustomerResponse.json();
        console.log("Müşteri oluşturuldu:", result);

        customerToUse = {
          id: result.data.id,
          ...manualCustomerData,
        };

        // Form data'yı güncelle
        data.customerId = customerToUse.id;
        data.customerName = customerToUse.name;
        data.tcNumber = customerToUse.tcNumber;

        console.log("Form data güncellendi:", data);

        // Yeni müşteriyi listeye ekle
        setCustomers((prev) => [...prev, customerToUse as Customer]);
      }

      console.log("Dosyalar siliniyor...");

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

      console.log("Final form data gönderiliyor:", {
        ...(initialData && { policyNumber: data.policyNumber }),
        customerId: data.customerId,
        customerName: data.customerName,
        tcNumber: data.tcNumber,
        plateNumber: data.plateNumber,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        premium: data.premium,
        policyType: data.policyType,
        status: data.status,
        description: data.description,
        files: files,
      });

      // Sonra formu gönder
      await onSubmit({
        ...(initialData && { policyNumber: data.policyNumber }),
        customerId: data.customerId,
        customerName: data.customerName,
        tcNumber: data.tcNumber,
        plateNumber: data.plateNumber,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        premium: data.premium,
        policyType: data.policyType,
        status: data.status,
        description: data.description,
        files: files,
      });

      console.log("Form başarıyla gönderildi");
    } catch (error) {
      console.error("Form submit hatası:", error);
      alert(
        "Form gönderilirken bir hata oluştu: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-gray-50"
                  placeholder={
                    initialData
                      ? "Mevcut poliçe numarası"
                      : "Otomatik oluşturulacak (POL-2025-XXX)"
                  }
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">
                  {initialData
                    ? "Düzenleme sırasında poliçe numarası değiştirilemez"
                    : "Poliçe numarası kayıt sırasında otomatik olarak oluşturulacaktır"}
                </p>
                {errors.policyNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.policyNumber.message}
                  </p>
                )}
              </div>

              {/* Müşteri Bilgileri - Tam genişlik */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Müşteri Bilgileri
                </label>

                {/* Düzenleme modunda da basit müşteri seçimi */}
                {initialData ? (
                  <div className="space-y-4">
                    {/* Müşteri seçimi modu toggle */}
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center text-gray-900 font-medium">
                        <input
                          type="radio"
                          name="customerMode"
                          value="existing"
                          checked={!isManualCustomerEntry}
                          onChange={() => {
                            setIsManualCustomerEntry(false);
                            setManualCustomerData({
                              name: "",
                              tcNumber: "",
                              email: "",
                              phone: "",
                              address: "",
                            });
                          }}
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
                            setValue("customerId", 0);
                            setValue("customerName", "");
                            setValue("tcNumber", "");
                            setCustomerQuery("");
                            setSelectedCustomer(null);
                            setManualCustomerData({
                              name: "",
                              tcNumber: "",
                              email: "",
                              phone: "",
                              address: "",
                            });
                          }}
                          className="mr-2"
                        />
                        Yeni Müşteri Bilgileri Gir
                      </label>
                    </div>

                    {/* Kayıtlı müşteri seçimi */}
                    {!isManualCustomerEntry && (
                      <Combobox
                        value={selectedCustomer}
                        onChange={(customer) => {
                          setSelectedCustomer(customer);
                          if (customer) {
                            setValue("customerId", customer.id);
                            setValue("customerName", customer.name || "");
                            setValue("tcNumber", customer.tcNumber || "");
                          } else {
                            setValue("customerId", 0);
                            setValue("customerName", "");
                            setValue("tcNumber", "");
                          }
                        }}
                      >
                        <div className="relative">
                          <Combobox.Input
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-600 pr-10"
                            displayValue={(customer: Customer | null) =>
                              customer?.name || ""
                            }
                            onChange={(event) =>
                              setCustomerQuery(event.target.value)
                            }
                            placeholder="Müşteri seçin veya arayın..."
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </Combobox.Button>

                          <Combobox.Options className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {isLoadingCustomers ? (
                              <div className="p-3 text-gray-500 text-center">
                                <p>Müşteriler yükleniyor...</p>
                              </div>
                            ) : customerError ? (
                              <div className="p-3 text-red-500 text-center">
                                <p>{customerError}</p>
                              </div>
                            ) : filteredCustomers.length === 0 &&
                              customerQuery !== "" ? (
                              <div className="p-3 text-gray-500 text-center">
                                <p>Müşteri bulunamadı</p>
                              </div>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <Combobox.Option
                                  key={customer.id}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-3 px-4 ${
                                      active
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-900"
                                    }`
                                  }
                                  value={customer}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <div className="flex flex-col">
                                        <span
                                          className={`block truncate ${
                                            selected
                                              ? "font-medium"
                                              : "font-normal"
                                          }`}
                                        >
                                          {customer.name || "İsimsiz"}
                                        </span>
                                        <span className="text-sm opacity-75">
                                          TC:{" "}
                                          {customer.tcNumber || "Belirtilmemiş"}
                                        </span>
                                        <span className="text-sm opacity-75">
                                          {customer.phone || "Telefon yok"} •{" "}
                                          {customer.email || "E-posta yok"}
                                        </span>
                                      </div>
                                      {selected ? (
                                        <span
                                          className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                            active
                                              ? "text-white"
                                              : "text-blue-600"
                                          }`}
                                        >
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    )}

                    {/* Manuel müşteri bilgisi giriş alanları */}
                    {isManualCustomerEntry && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adı Soyadı *
                          </label>
                          <input
                            type="text"
                            value={manualCustomerData.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setManualCustomerData({
                                ...manualCustomerData,
                                name: newName,
                              });
                              setValue("customerName", newName);
                            }}
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
                            onChange={(e) => {
                              const newTcNumber = e.target.value;
                              setManualCustomerData({
                                ...manualCustomerData,
                                tcNumber: newTcNumber,
                              });
                              setValue("tcNumber", newTcNumber);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="TC Kimlik numarasını girin"
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
                  </div>
                ) : (
                  /* Yeni poliçe modunda mevcut seçenekleri göster */
                  <div>
                    {/* Müşteri seçimi modu toggle */}
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center text-gray-900 font-medium">
                        <input
                          type="radio"
                          name="customerMode"
                          value="existing"
                          checked={!isManualCustomerEntry}
                          onChange={() => {
                            setIsManualCustomerEntry(false);
                            setManualCustomerData({
                              name: "",
                              tcNumber: "",
                              email: "",
                              phone: "",
                              address: "",
                            });
                          }}
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
                            setValue("customerId", 0);
                            setValue("customerName", "");
                            setValue("tcNumber", "");
                            setCustomerQuery("");
                            setSelectedCustomer(null);
                            setManualCustomerData({
                              name: "",
                              tcNumber: "",
                              email: "",
                              phone: "",
                              address: "",
                            });
                          }}
                          className="mr-2"
                        />
                        Yeni Müşteri Bilgileri Gir
                      </label>
                    </div>

                    {/* Kayıtlı müşteri seçimi */}
                    {!isManualCustomerEntry && (
                      <Combobox
                        value={selectedCustomer}
                        onChange={(customer) => {
                          setSelectedCustomer(customer);
                          if (customer) {
                            setValue("customerId", customer.id);
                            setValue("customerName", customer.name || "");
                            setValue("tcNumber", customer.tcNumber || "");
                          } else {
                            setValue("customerId", 0);
                            setValue("customerName", "");
                            setValue("tcNumber", "");
                          }
                        }}
                      >
                        <div className="relative">
                          <Combobox.Input
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-600 pr-10"
                            displayValue={(customer: Customer | null) =>
                              customer?.name || ""
                            }
                            onChange={(event) =>
                              setCustomerQuery(event.target.value)
                            }
                            placeholder="Ad, TC No, telefon veya e-posta ile ara..."
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </Combobox.Button>

                          <Combobox.Options className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {isLoadingCustomers ? (
                              <div className="p-3 text-gray-500 text-center">
                                <p>Müşteriler yükleniyor...</p>
                              </div>
                            ) : customerError ? (
                              <div className="p-3 text-red-500 text-center">
                                <p>{customerError}</p>
                              </div>
                            ) : filteredCustomers.length === 0 &&
                              customerQuery !== "" ? (
                              <div className="p-3 text-gray-500 text-center">
                                <p>Müşteri bulunamadı</p>
                              </div>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <Combobox.Option
                                  key={customer.id}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-3 px-4 ${
                                      active
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-900"
                                    }`
                                  }
                                  value={customer}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <div className="flex flex-col">
                                        <span
                                          className={`block truncate ${
                                            selected
                                              ? "font-medium"
                                              : "font-normal"
                                          }`}
                                        >
                                          {customer.name || "İsimsiz"}
                                        </span>
                                        <span className="text-sm opacity-75">
                                          TC:{" "}
                                          {customer.tcNumber || "Belirtilmemiş"}
                                        </span>
                                        <span className="text-sm opacity-75">
                                          {customer.phone || "Telefon yok"} •{" "}
                                          {customer.email || "E-posta yok"}
                                        </span>
                                      </div>
                                      {selected ? (
                                        <span
                                          className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                            active
                                              ? "text-white"
                                              : "text-blue-600"
                                          }`}
                                        >
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    )}

                    {/* Manuel müşteri bilgisi giriş alanları */}
                    {isManualCustomerEntry && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adı Soyadı *
                          </label>
                          <input
                            type="text"
                            value={manualCustomerData.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setManualCustomerData({
                                ...manualCustomerData,
                                name: newName,
                              });
                              setValue("customerName", newName);
                            }}
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
                            onChange={(e) => {
                              const newTcNumber = e.target.value;
                              setManualCustomerData({
                                ...manualCustomerData,
                                tcNumber: newTcNumber,
                              });
                              setValue("tcNumber", newTcNumber);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="TC Kimlik numarasını girin"
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
                  </div>
                )}
              </div>

              {/* TC No alanı - kayıtlı müşteri seçiminde göster */}
              {!isManualCustomerEntry && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    TC No
                  </label>
                  <input
                    type="text"
                    value={watchedTcNumber || ""}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-gray-50"
                    readOnly
                    placeholder="Müşteri seçildiğinde otomatik doldurulur"
                  />
                  {errors.tcNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.tcNumber.message}
                    </p>
                  )}
                </div>
              )}

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

            <div className="mt-6 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-200">
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
