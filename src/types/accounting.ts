export interface AccountingRecord {
  id: number;
  customerId: number;
  plateNumber?: string;
  transactionDate: string;
  amount: number;
  type: "Gelir" | "Gider";
  description: string;
  createdAt: string;
  customerName?: string;
  tcNumber?: string;
  status?: "Aktif" | "Deaktif";
}

export interface AccountingFilter {
  customerId?: number;
  type?: "Gelir" | "Gider";
  startDate?: string;
  endDate?: string;
  plateNumber?: string;
}

export interface AccountingFormData {
  customerId: string;
  plateNumber?: string;
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

export interface CustomerAccountingSummary {
  customer: {
    id: number;
    name: string;
    tcNumber: string;
    phone: string;
  };
  totalBalance: number;
  status: "Aktif" | "Deaktif";
  plateTransactions: {
    plateNumber: string;
    transactions: AccountingRecord[];
    balance: number;
  }[];
}
