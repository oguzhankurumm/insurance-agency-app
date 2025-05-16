"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import AccountingTable from "@/components/AccountingTable";
import AccountingFormModal from "@/components/AccountingFormModal";
import type { AccountingRecord, AccountingFormData } from "@/types/accounting";
import type { Policy } from "@/lib/db";

export default function AccountingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AccountingRecord | null>(
    null
  );
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchPolicies();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/accounting");
      if (!response.ok) throw new Error("Kayıtlar alınamadı");
      const data = await response.json();
      setRecords(data || []);
    } catch (error) {
      console.error("Kayıtlar alınırken hata:", error);
      setError("Kayıtlar alınamadı");
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch("/api/policies");
      if (!response.ok) throw new Error("Poliçeler alınamadı");
      const data = await response.json();
      setPolicies(data.data || []);

      console.log("data", data.data);
    } catch (error) {
      console.error("Poliçeler alınırken hata:", error);
      setError("Poliçeler alınamadı");
    }
  };

  const handleSubmit = async (data: AccountingFormData) => {
    try {
      const url = selectedRecord
        ? `/api/accounting/${selectedRecord.id}`
        : "/api/accounting";
      const method = selectedRecord ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          transactionDate: data.transactionDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "İşlem başarısız");
      }

      await fetchRecords();
      setIsModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Kayıt işlemi sırasında hata:", error);
      setError(error instanceof Error ? error.message : "Bir hata oluştu");
    }
  };

  const handleEdit = (record: AccountingRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (record: AccountingRecord) => {
    if (!window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/accounting/${record.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Silme işlemi başarısız");
      }

      await fetchRecords();
    } catch (error) {
      console.error("Kayıt silinirken hata:", error);
      setError(
        error instanceof Error ? error.message : "Silme işlemi başarısız"
      );
    }
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchRecords();
            fetchPolicies();
          }}
          className="mt-2 text-blue-500 hover:text-blue-700"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Muhasebe Kayıtları</h1>
        <button
          onClick={() => {
            setSelectedRecord(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni Kayıt
        </button>
      </div>

      <AccountingTable
        records={records}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AccountingFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedRecord}
        policies={policies
          .filter((p): p is Policy & { id: number } => p.id !== undefined)
          .map((p) => ({
            id: p.id.toString(),
            policyNumber: p.policyNumber,
          }))}
      />
    </div>
  );
}
