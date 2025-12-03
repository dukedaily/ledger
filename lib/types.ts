import { CurrencyCode, WalletType, ExpenseCategory, IncomeCategory } from './config';

export interface Wallet {
  id: number;
  name: string;
  wallet_type: WalletType;
  currency: CurrencyCode;
  balance: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  transaction_type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  date: string;
  to_wallet_id: number | null;
  is_recurring: boolean;
  recurring_type: 'monthly' | 'yearly' | null;
  tags: string;
  created_at: string;
}

export interface Budget {
  id: number;
  category: string;
  amount: number;
  currency: CurrencyCode;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RecurringTransaction {
  id: number;
  wallet_id: number;
  transaction_type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  frequency: 'monthly' | 'yearly';
  day_of_month: number;
  month_of_year: number | null;
  is_active: boolean;
  last_generated: string | null;
  created_at: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
  net: number;
  expense_by_category: Record<string, number>;
  income_by_category: Record<string, number>;
}

export interface CreateWalletInput {
  name: string;
  wallet_type: WalletType;
  currency: CurrencyCode;
  balance?: number;
  description?: string;
}

export interface CreateTransactionInput {
  wallet_id: number;
  transaction_type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  description?: string;
  date?: string;
  to_wallet_id?: number;
  tags?: string;
}
