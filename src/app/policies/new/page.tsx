"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PolicyForm from "@/components/PolicyForm";
import type { PolicyFormData } from "@/types/policy";

export default function NewPolicyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PolicyFormData) => {
    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Poliçe oluşturulamadı");
      }

      router.push("/policies");
    } catch (error) {
      console.error("Poliçe oluşturulurken hata:", error);
      setError(error instanceof Error ? error.message : "Bir hata oluştu");
    }
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-blue-500 hover:text-blue-700"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Yeni Poliçe</h1>
      <PolicyForm onSubmit={handleSubmit} />
    </div>
  );
}
