export interface AccountingRecord {
  id: number;
  policyId: number;
  policyNumber: string;
  transactionDate: string;
  amount: number;
  type: "Gelir" | "Gider";
  description: string;
  createdAt: string;
}

export interface AccountingFilter {
  policyId?: number;
  type?: "Gelir" | "Gider";
  startDate?: string;
  endDate?: string;
}

export interface AccountingFormData {
  policyId: string;
  transactionDate: Date;
  amount: number;
  type: "Gelir" | "Gider";
  description: string;
}

export interface AccountingSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
}
