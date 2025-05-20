import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { AccountingRecord } from "@/types/accounting";
import type { Policy } from "@/types/policy";
import { useState } from "react";
import PolicyFilesModal from "./PolicyFilesModal";

interface AccountingTableProps {
  records: AccountingRecord[];
  onEdit: (record: AccountingRecord) => void;
  onDelete: (record: AccountingRecord) => void;
  customers: { id: number; name: string }[];
  policies: Policy[];
}

const columnHelper = createColumnHelper<AccountingRecord>();

export default function AccountingTable({
  records,
  onEdit,
  onDelete,
  customers,
  policies,
}: AccountingTableProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  const handleViewFiles = (record: AccountingRecord) => {
    const policy = policies.find((p) => p.policyNumber === record.policyNumber);
    if (policy) {
      setSelectedPolicy(policy);
      setIsFilesModalOpen(true);
    }
  };

  const columns = [
    {
      header: "Tarih",
      accessorKey: "transactionDate",
      cell: (info: { getValue: () => string }) =>
        new Date(info.getValue()).toLocaleDateString("tr-TR"),
    },
    {
      header: "Müşteri",
      accessorKey: "customerName",
      cell: (info: { row: { original: AccountingRecord } }) => {
        const policy = policies.find(
          (p) => p.policyNumber === info.row.original.policyNumber
        );
        const customer = policy
          ? customers.find((c) => c.id === policy.customerId)
          : null;
        return customer?.name || "-";
      },
    },
    {
      header: "Plaka No",
      accessorKey: "policyPlateNumber",
      cell: (info: { row: { original: AccountingRecord } }) => {
        const policy = policies.find(
          (p) => p.policyNumber === info.row.original.policyNumber
        );

        return policy?.plateNumber ?? "-";
      },
    },
    {
      header: "Poliçe No",
      accessorKey: "policyNumber",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Tür",
      accessorKey: "type",
      cell: (info: { getValue: () => string }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() === "Gelir"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {info.getValue()}
        </span>
      ),
    },
    columnHelper.accessor("amount", {
      header: "Tutar",
      cell: (info) => `₺${info.getValue().toLocaleString("tr-TR")}`,
    }),
    columnHelper.accessor("description", {
      header: "Açıklama",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.display({
      id: "actions",
      header: "İşlemler",
      cell: (info) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewFiles(info.row.original)}
            className="text-gray-600 hover:text-gray-800"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(info.row.original)}
            className="text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(info.row.original)}
            className="text-red-600 hover:text-red-800"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <span className="mx-2 text-sm text-gray-700">
              Sayfa {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      {selectedPolicy && (
        <PolicyFilesModal
          isOpen={isFilesModalOpen}
          onClose={() => {
            setIsFilesModalOpen(false);
            setSelectedPolicy(null);
          }}
          policy={selectedPolicy}
        />
      )}
    </div>
  );
}
