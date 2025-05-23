export type ReportType =
  | "monthly"
  | "yearly"
  | "policy-type"
  | "customer"
  | "unpaid-payments"
  | "active-policies"
  | "expiring-policies"
  | "customer-policies"
  | "customer-accounting";

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  policyType?: string;
  customerName?: string;
  type?: "income" | "expense";
}

export interface MonthlyReport {
  month: string;
  income: number;
  expense: number;
  netAmount: number;
  policyCount: number;
}

export interface YearlyReport {
  year: string;
  income: number;
  expense: number;
  netAmount: number;
  policyCount: number;
}

export interface PolicyTypeReport {
  policyType: string;
  income: number;
  expense: number;
  netAmount: number;
  policyCount: number;
}

export interface CustomerReport {
  customerId: number;
  customerName: string;
  income: number;
  expense: number;
  netAmount: number;
  policyCount: number;
}

export interface UnpaidPaymentsReport {
  policyId: number;
  policyNumber: string;
  customerName: string;
  dueDate: string;
  amount: number;
  daysPastDue: number;
}

export interface ActivePoliciesReport {
  id: number;
  policyNumber: string;
  customerName: string;
  startDate: string;
  endDate: string;
  premium: number;
  policyType: string;
  status: string;
}

export interface ExpiringPoliciesReport {
  id: number;
  policyNumber: string;
  customerName: string;
  endDate: string;
  daysUntilExpiry: number;
  premium: number;
  policyType: string;
}

export interface CustomerPoliciesReport {
  customerId: number;
  customerName: string;
  activePolicies: number;
  totalPremium: number;
  lastPolicyDate: string;
}

export interface CustomerAccountingReport {
  customerId: number;
  customerName: string;
  tcNumber: string;
  transactionId: number;
  transactionDate: string;
  amount: number;
  type: string;
  description: string;
  policyNumber: string;
  plateNumber: string;
  policyType: string;
  runningBalance: number;
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  days?: string;
}

export type ReportDataType =
  | MonthlyReport
  | YearlyReport
  | PolicyTypeReport
  | CustomerReport
  | UnpaidPaymentsReport
  | ActivePoliciesReport
  | ExpiringPoliciesReport
  | CustomerPoliciesReport
  | CustomerAccountingReport;

export interface ReportData {
  type: ReportType;
  data: ReportDataType[];
  summary?: {
    totalCustomers?: number;
    totalPolicies?: number;
    totalPremium?: number;
    totalIncome?: number;
    totalExpense?: number;
    netAmount?: number;
    unpaidAmount?: number;
  };
}
