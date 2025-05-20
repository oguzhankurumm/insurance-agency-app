export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Policy {
  id: number;
  policyNumber: string;
  customerId: number;
  customerName: string;
  tcNumber: string;
  plateNumber?: string;
  startDate: string;
  endDate: string;
  premium: number;
  policyType: string;
  status: "Aktif" | "Pasif" | "İptal";
  description: string;
  files?: FileData[];
}

export interface PolicyFilter {
  status?: string;
  startDate?: string;
  endDate?: string;
  customerName?: string;
  plateNumber?: string;
  search?: string;
}

export interface PolicyDetail extends Policy {
  accountingRecords: {
    id: number;
    transactionDate: string;
    amount: number;
    type: "Gelir" | "Gider";
    description: string;
  }[];
}

export interface PolicyFormData {
  policyNumber: string;
  customerId: number;
  customerName: string;
  tcNumber: string;
  plateNumber?: string;
  startDate: string;
  endDate: string;
  premium: number;
  policyType: (typeof POLICY_TYPES)[number];
  status: "Aktif" | "Pasif" | "İptal";
  description: string;
  files?: FileData[];
}

export interface PolicyFormState {
  policyNumber: string;
  customerId: number;
  customerName: string;
  tcNumber: string;
  plateNumber?: string;
  startDate: Date;
  endDate: Date;
  premium: number;
  policyType: (typeof POLICY_TYPES)[number];
  status: "Aktif" | "Pasif" | "İptal";
  description: string;
}

export const POLICY_TYPES = [
  "Kasko",
  "Trafik",
  "Konut",
  "Sağlık",
  "Hayat",
  "Diğer",
] as const;

export const POLICY_STATUS = ["Aktif", "Pasif", "İptal"] as const;
