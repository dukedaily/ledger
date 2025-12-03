import Database from 'better-sqlite3';
import path from 'path';
import { Wallet, Transaction, Budget, MonthlySummary } from './types';

const dbPath = path.join(process.cwd(), 'ledger.db');
const db = new Database(dbPath);

// 初始化数据库表
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      wallet_type TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SGD',
      balance REAL DEFAULT 0.0,
      description TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SGD',
      description TEXT DEFAULT '',
      date TIMESTAMP NOT NULL,
      to_wallet_id INTEGER,
      is_recurring INTEGER DEFAULT 0,
      recurring_type TEXT,
      tags TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SGD',
      period TEXT NOT NULL DEFAULT 'monthly',
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SGD',
      description TEXT DEFAULT '',
      frequency TEXT NOT NULL DEFAULT 'monthly',
      day_of_month INTEGER DEFAULT 1,
      month_of_year INTEGER,
      is_active INTEGER DEFAULT 1,
      last_generated TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    );
  `);
}

// 初始化
initDatabase();

// ==================== 钱包操作 ====================

export function createWallet(data: {
  name: string;
  wallet_type: string;
  currency: string;
  balance?: number;
  description?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO wallets (name, wallet_type, currency, balance, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.wallet_type,
    data.currency,
    data.balance || 0,
    data.description || ''
  );
  return result.lastInsertRowid as number;
}

export function getWallets(activeOnly = true): Wallet[] {
  const query = activeOnly
    ? 'SELECT * FROM wallets WHERE is_active = 1 ORDER BY wallet_type, name'
    : 'SELECT * FROM wallets ORDER BY wallet_type, name';
  return db.prepare(query).all() as Wallet[];
}

export function getWallet(id: number): Wallet | undefined {
  return db.prepare('SELECT * FROM wallets WHERE id = ?').get(id) as Wallet | undefined;
}

export function updateWalletBalance(walletId: number, amount: number, isAddition: boolean) {
  const operator = isAddition ? '+' : '-';
  db.prepare(`
    UPDATE wallets SET balance = balance ${operator} ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(amount, walletId);
}

export function deleteWallet(id: number) {
  db.prepare("UPDATE wallets SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
}

// ==================== 交易操作 ====================

export function createTransaction(data: {
  wallet_id: number;
  transaction_type: string;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  to_wallet_id?: number;
  tags?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO transactions (wallet_id, transaction_type, category, amount, currency, description, date, to_wallet_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.wallet_id,
    data.transaction_type,
    data.category,
    data.amount,
    data.currency,
    data.description || '',
    data.date,
    data.to_wallet_id || null,
    data.tags || ''
  );

  // 更新钱包余额
  if (data.transaction_type === 'income') {
    updateWalletBalance(data.wallet_id, data.amount, true);
  } else if (data.transaction_type === 'expense') {
    updateWalletBalance(data.wallet_id, data.amount, false);
  } else if (data.transaction_type === 'transfer' && data.to_wallet_id) {
    updateWalletBalance(data.wallet_id, data.amount, false);
    updateWalletBalance(data.to_wallet_id, data.amount, true);
  }

  return result.lastInsertRowid as number;
}

export function getTransactions(options: {
  wallet_id?: number;
  transaction_type?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
} = {}): Transaction[] {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (options.wallet_id) {
    query += ' AND wallet_id = ?';
    params.push(options.wallet_id);
  }
  if (options.transaction_type) {
    query += ' AND transaction_type = ?';
    params.push(options.transaction_type);
  }
  if (options.category) {
    query += ' AND category = ?';
    params.push(options.category);
  }
  if (options.start_date) {
    query += ' AND date >= ?';
    params.push(options.start_date);
  }
  if (options.end_date) {
    query += ' AND date <= ?';
    params.push(options.end_date);
  }

  query += ' ORDER BY date DESC LIMIT ?';
  params.push(options.limit || 100);

  return db.prepare(query).all(...params) as Transaction[];
}

export function deleteTransaction(id: number) {
  const trans = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction;
  if (trans) {
    // 恢复钱包余额
    if (trans.transaction_type === 'income') {
      updateWalletBalance(trans.wallet_id, trans.amount, false);
    } else if (trans.transaction_type === 'expense') {
      updateWalletBalance(trans.wallet_id, trans.amount, true);
    } else if (trans.transaction_type === 'transfer' && trans.to_wallet_id) {
      updateWalletBalance(trans.wallet_id, trans.amount, true);
      updateWalletBalance(trans.to_wallet_id, trans.amount, false);
    }
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  }
}

// ==================== 预算操作 ====================

export function createBudget(data: {
  category: string;
  amount: number;
  currency: string;
  period: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO budgets (category, amount, currency, period, start_date)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  const result = stmt.run(data.category, data.amount, data.currency, data.period);
  return result.lastInsertRowid as number;
}

export function getBudgets(activeOnly = true): Budget[] {
  const query = activeOnly
    ? 'SELECT * FROM budgets WHERE is_active = 1 ORDER BY category'
    : 'SELECT * FROM budgets ORDER BY category';
  return db.prepare(query).all() as Budget[];
}

export function deleteBudget(id: number) {
  db.prepare("UPDATE budgets SET is_active = 0 WHERE id = ?").run(id);
}

// ==================== 统计功能 ====================

export function getMonthlySummary(year: number, month: number): MonthlySummary {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  // 总收入
  const incomeResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE transaction_type = 'income' AND date >= ? AND date < ?
  `).get(startDate, endDate) as { total: number };

  // 总支出
  const expenseResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE transaction_type = 'expense' AND date >= ? AND date < ?
  `).get(startDate, endDate) as { total: number };

  // 按分类统计支出
  const expenseByCategory = db.prepare(`
    SELECT category, SUM(amount) as total FROM transactions
    WHERE transaction_type = 'expense' AND date >= ? AND date < ?
    GROUP BY category ORDER BY total DESC
  `).all(startDate, endDate) as { category: string; total: number }[];

  // 按分类统计收入
  const incomeByCategory = db.prepare(`
    SELECT category, SUM(amount) as total FROM transactions
    WHERE transaction_type = 'income' AND date >= ? AND date < ?
    GROUP BY category ORDER BY total DESC
  `).all(startDate, endDate) as { category: string; total: number }[];

  return {
    year,
    month,
    total_income: incomeResult.total,
    total_expense: expenseResult.total,
    net: incomeResult.total - expenseResult.total,
    expense_by_category: Object.fromEntries(expenseByCategory.map(e => [e.category, e.total])),
    income_by_category: Object.fromEntries(incomeByCategory.map(e => [e.category, e.total])),
  };
}

export function getYearlySummary(year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;

  const incomeResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE transaction_type = 'income' AND date >= ? AND date < ?
  `).get(startDate, endDate) as { total: number };

  const expenseResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE transaction_type = 'expense' AND date >= ? AND date < ?
  `).get(startDate, endDate) as { total: number };

  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    monthlyData.push(getMonthlySummary(year, m));
  }

  return {
    year,
    total_income: incomeResult.total,
    total_expense: expenseResult.total,
    net: incomeResult.total - expenseResult.total,
    monthly_data: monthlyData,
  };
}

export function getTotalBalanceByCurrency(): Record<string, number> {
  const results = db.prepare(`
    SELECT currency, SUM(balance) as total FROM wallets
    WHERE is_active = 1 GROUP BY currency
  `).all() as { currency: string; total: number }[];
  return Object.fromEntries(results.map(r => [r.currency, r.total]));
}
