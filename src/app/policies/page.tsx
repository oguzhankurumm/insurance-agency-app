"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { Dialog } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  Policy,
  PolicyFilter,
  PolicyDetail,
  PolicyFormData,
  POLICY_TYPES,
} from "@/types/policy";
import PolicyFormModal from "@/components/PolicyFormModal";
import useDebounce from "@/hooks/useDebounce";

const columnHelper = createColumnHelper<Policy>();

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<PolicyFilter>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDetail | null>(
    null
  );
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchInput, 500);

  const handleViewDetails = async (policy: Policy) => {
    try {
      const response = await fetch(`/api/policies/${policy.id}`);
      if (!response.ok) throw new Error("Poliçe detayları alınamadı");
      const { data } = await response.json();
      setSelectedPolicy({
        ...data.policy,
        accountingRecords: data.accountingRecords,
      });
      setIsDetailModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const handleEdit = (policy: Policy) => {
    setEditingPolicy({
      ...policy,
      startDate: new Date(policy.startDate).toISOString(),
      endDate: new Date(policy.endDate).toISOString(),
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async (policy: Policy) => {
    if (!confirm("Bu poliçeyi silmek istediğinizden emin misiniz?")) return;
    try {
      const response = await fetch(`/api/policies/${policy.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Poliçe silinemedi");
      fetchPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const columns = [
    columnHelper.accessor("policyNumber", {
      header: "Poliçe No",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("customerName", {
      header: "Müşteri",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("startDate", {
      header: "Başlangıç",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("tr-TR"),
    }),
    columnHelper.accessor("endDate", {
      header: "Bitiş",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("tr-TR"),
    }),
    columnHelper.accessor("premium", {
      header: "Prim",
      cell: (info) => `₺${info.getValue().toLocaleString()}`,
    }),
    columnHelper.accessor("status", {
      header: "Durum",
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() === "Aktif"
              ? "bg-green-100 text-green-800"
              : info.getValue() === "Pasif"
              ? "bg-gray-100 text-gray-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "İşlemler",
      cell: (props) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetails(props.row.original)}
            className="text-blue-600 hover:text-blue-800"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEdit(props.row.original)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(props.row.original)}
            className="text-red-600 hover:text-red-800"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: policies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: filters.search,
    },
    onGlobalFilterChange: (value) => setFilters({ ...filters, search: value }),
  });

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/policies?" +
          new URLSearchParams(filters as Record<string, string>)
      );
      if (!response.ok) throw new Error("Veriler alınamadı");
      const data = await response.json();
      setPolicies(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPolicies();
  }, [filters, fetchPolicies]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const handleSubmit = async (data: PolicyFormData) => {
    try {
      const url = editingPolicy
        ? `/api/policies/${editingPolicy.id}`
        : "/api/policies";
      const method = editingPolicy ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Poliçe kaydedilemedi");

      setIsFormModalOpen(false);
      setEditingPolicy(null);
      fetchPolicies();
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
      {/* Başlık ve Yeni Poliçe Butonu */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Poliçeler</h1>
        <button
          onClick={() => {
            setEditingPolicy(null);
            setIsFormModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Yeni Poliçe Ekle
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Durum
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tümü</option>
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
              <option value="İptal">İptal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Arama
            </label>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Poliçe no veya müşteri ara..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10 text-gray-900"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-gray-900"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm text-gray-900 disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm text-gray-900 disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
            <div className="text-sm text-gray-900">
              Sayfa {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </div>
          </div>
        </div>
      </div>

      {/* Detay Modalı */}
      <Dialog
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-lg shadow-xl">
            {selectedPolicy && (
              <div className="p-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                  Poliçe Detayları
                </Dialog.Title>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-900">Poliçe No</p>
                    <p className="font-medium text-gray-900">
                      {selectedPolicy.policyNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Müşteri</p>
                    <p className="font-medium text-gray-900">
                      {selectedPolicy.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Başlangıç Tarihi</p>
                    <p className="font-medium text-gray-900">
                      {selectedPolicy.startDate &&
                      !isNaN(new Date(selectedPolicy.startDate).getTime())
                        ? new Date(selectedPolicy.startDate).toLocaleDateString(
                            "tr-TR"
                          )
                        : "Belirtilmemiş"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Bitiş Tarihi</p>
                    <p className="font-medium text-gray-900">
                      {selectedPolicy.endDate &&
                      !isNaN(new Date(selectedPolicy.endDate).getTime())
                        ? new Date(selectedPolicy.endDate).toLocaleDateString(
                            "tr-TR"
                          )
                        : "Belirtilmemiş"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Prim</p>
                    <p className="font-medium text-gray-900">
                      ₺
                      {selectedPolicy.premium
                        ? selectedPolicy.premium.toLocaleString()
                        : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Durum</p>
                    <p className="font-medium text-gray-900">
                      {selectedPolicy.status}
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Muhasebe Kayıtları
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase">
                          Tarih
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase">
                          Tür
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase">
                          Tutar
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase">
                          Açıklama
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPolicy.accountingRecords?.map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-2 text-gray-900">
                            {new Date(
                              record.transactionDate
                            ).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.type === "Gelir"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {record.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            ₺{record.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {record.description}
                          </td>
                        </tr>
                      ))}
                      {(!selectedPolicy.accountingRecords ||
                        selectedPolicy.accountingRecords.length === 0) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-center text-gray-500"
                          >
                            Muhasebe kaydı bulunmamaktadır
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Form Modalı */}
      <PolicyFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPolicy(null);
        }}
        onSubmit={handleSubmit}
        initialData={
          editingPolicy
            ? {
                policyNumber: editingPolicy.policyNumber,
                customerId: editingPolicy.customerId,
                customerName: editingPolicy.customerName,
                tcNumber: editingPolicy.tcNumber,
                startDate: editingPolicy.startDate,
                endDate: editingPolicy.endDate,
                premium: editingPolicy.premium,
                policyType:
                  editingPolicy.policyType as (typeof POLICY_TYPES)[number],
                status: editingPolicy.status,
                description: editingPolicy.description,
              }
            : undefined
        }
      />
    </div>
  );
}
