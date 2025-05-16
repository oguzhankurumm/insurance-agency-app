export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

export function formatEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function formatPolicyNumber(number: string): string {
  return number.toUpperCase().trim();
}

export function isValidDate(date: string): boolean {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidPhone(phone: string): boolean {
  const re = /^[0-9]{10}$/;
  return re.test(phone.replace(/\D/g, ""));
}

export function isValidPolicyNumber(number: string): boolean {
  const re = /^[A-Z0-9]{6,12}$/;
  return re.test(number.toUpperCase());
}

export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000000;
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  // eslint-disable-next-line prefer-const
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

export function getYearRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);
  return { start, end };
}

export function getDaysUntilExpiry(endDate: Date): number {
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(endDate: Date, days: number = 30): boolean {
  return getDaysUntilExpiry(endDate) <= days;
}

export function calculateNetAmount(income: number, expense: number): number {
  return income - expense;
}

export function calculateVAT(amount: number, rate: number = 0.18): number {
  return amount * rate;
}

export function calculateTotalWithVAT(
  amount: number,
  rate: number = 0.18
): number {
  return amount * (1 + rate);
}
