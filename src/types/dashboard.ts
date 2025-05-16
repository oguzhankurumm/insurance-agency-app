export interface DashboardStats {
  activePolicies: number;
  expiringPolicies: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface ExpiringPolicy {
  policyNumber: string;
  customerName: string;
  endDate: string;
  daysUntilExpiry: number;
}

export interface DashboardData {
  stats: DashboardStats;
  expiringPolicies: ExpiringPolicy[];
}
