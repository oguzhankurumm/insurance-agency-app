import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AccountingRecord } from "@/types/accounting";
import type { Policy } from "@/lib/db";

interface AccountingTableProps {
  records: AccountingRecord[];
  onEdit: (record: AccountingRecord) => void;
  onDelete: (record: AccountingRecord) => Promise<void>;
  customers: { id: number; name: string }[];
  policies: Policy[];
}

const columnHelper = createColumnHelper<AccountingRecord>();

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function AccountingTable({
  records,
  onEdit,
  onDelete,
  customers,
  policies,
}: AccountingTableProps) {
  const columns = [
    columnHelper.accessor("transactionDate", {
      header: "Tarih",
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor("policyNumber", {
      header: "Poliçe No",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "customerName",
      header: "Müşteri",
      cell: (info) => {
        const policy = policies.find(
          (p) => p.id === info.row.original.policyId
        );
        const customer = policy
          ? customers.find((c) => c.id === policy.customerId)
          : null;
        return customer?.name || "-";
      },
    }),
    columnHelper.accessor("amount", {
      header: "Tutar",
      cell: (info) => `₺${info.getValue().toLocaleString("tr-TR")}`,
    }),
    columnHelper.accessor("type", {
      header: "Tür",
      cell: (info) => (
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
    }),
    columnHelper.accessor("description", {
      header: "Açıklama",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "İşlemler",
      cell: (info) => (
        <div className="flex items-center space-x-2">
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
      <div className="px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
          <div className="text-sm text-gray-700">
            Sayfa {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </div>
        </div>
      </div>
    </div>
  );
}
