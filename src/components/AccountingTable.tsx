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

interface AccountingTableProps {
  records: AccountingRecord[];
  onEdit: (record: AccountingRecord) => void;
  onDelete: (record: AccountingRecord) => void;
  customers: { id: number; name: string; tcNumber: string }[];
}

const columnHelper = createColumnHelper<AccountingRecord>();

export default function AccountingTable({
  records,
  onEdit,
  onDelete,
  customers,
}: AccountingTableProps) {
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
        const customer = customers.find(
          (c) => c.id === info.row.original.customerId
        );
        return (
          <div>
            <div className="font-medium">
              {customer?.name || info.row.original.customerName || "-"}
            </div>
            <div className="text-sm text-gray-500">
              TC: {customer?.tcNumber || info.row.original.tcNumber || "-"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Plaka No",
      accessorKey: "plateNumber",
      cell: (info: { getValue: () => string | undefined }) =>
        info.getValue() || "-",
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
          {info.getValue() === "Gelir" ? "Alacak (+)" : "Borç (-)"}
        </span>
      ),
    },
    columnHelper.accessor("amount", {
      header: "Tutar",
      cell: (info) => {
        const record = info.row.original;
        const sign = record.type === "Gelir" ? "+" : "-";
        const colorClass =
          record.type === "Gelir" ? "text-green-600" : "text-red-600";
        return (
          <span className={`font-medium ${colorClass}`}>
            {sign}₺{info.getValue().toLocaleString("tr-TR")}
          </span>
        );
      },
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
    </div>
  );
}
