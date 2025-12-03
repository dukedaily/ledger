"""
数据库操作层
Database Operations
"""

import sqlite3
from datetime import datetime
from typing import List, Optional, Tuple
from contextlib import contextmanager

from models import Wallet, Transaction, Budget, RecurringTransaction
from config import DATABASE_PATH, EXCHANGE_RATES


@contextmanager
def get_connection():
    """获取数据库连接的上下文管理器"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_database():
    """初始化数据库表"""
    with get_connection() as conn:
        cursor = conn.cursor()

        # 钱包表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                wallet_type TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'SGD',
                balance REAL DEFAULT 0.0,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 交易记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_id INTEGER NOT NULL,
                transaction_type TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'SGD',
                description TEXT,
                date TIMESTAMP NOT NULL,
                to_wallet_id INTEGER,
                is_recurring INTEGER DEFAULT 0,
                recurring_type TEXT,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (wallet_id) REFERENCES wallets(id),
                FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)
            )
        """)

        # 预算表
        cursor.execute("""
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
            )
        """)

        # 定期交易表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS recurring_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_id INTEGER NOT NULL,
                transaction_type TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'SGD',
                description TEXT,
                frequency TEXT NOT NULL DEFAULT 'monthly',
                day_of_month INTEGER DEFAULT 1,
                month_of_year INTEGER,
                is_active INTEGER DEFAULT 1,
                last_generated TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (wallet_id) REFERENCES wallets(id)
            )
        """)

        conn.commit()


# ==================== 钱包操作 ====================

def create_wallet(wallet: Wallet) -> int:
    """创建钱包"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO wallets (name, wallet_type, currency, balance, description, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (wallet.name, wallet.wallet_type, wallet.currency,
              wallet.balance, wallet.description, wallet.is_active))
        conn.commit()
        return cursor.lastrowid


def get_wallet(wallet_id: int) -> Optional[Wallet]:
    """获取单个钱包"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,))
        row = cursor.fetchone()
        if row:
            return Wallet(
                id=row['id'],
                name=row['name'],
                wallet_type=row['wallet_type'],
                currency=row['currency'],
                balance=row['balance'],
                description=row['description'] or '',
                is_active=bool(row['is_active']),
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now(),
                updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else datetime.now()
            )
        return None


def get_all_wallets(active_only: bool = True) -> List[Wallet]:
    """获取所有钱包"""
    with get_connection() as conn:
        cursor = conn.cursor()
        if active_only:
            cursor.execute("SELECT * FROM wallets WHERE is_active = 1 ORDER BY wallet_type, name")
        else:
            cursor.execute("SELECT * FROM wallets ORDER BY wallet_type, name")
        rows = cursor.fetchall()
        return [Wallet(
            id=row['id'],
            name=row['name'],
            wallet_type=row['wallet_type'],
            currency=row['currency'],
            balance=row['balance'],
            description=row['description'] or '',
            is_active=bool(row['is_active']),
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now(),
            updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else datetime.now()
        ) for row in rows]


def update_wallet_balance(wallet_id: int, amount: float, is_addition: bool = True):
    """更新钱包余额"""
    with get_connection() as conn:
        cursor = conn.cursor()
        if is_addition:
            cursor.execute("""
                UPDATE wallets SET balance = balance + ?, updated_at = ?
                WHERE id = ?
            """, (amount, datetime.now().isoformat(), wallet_id))
        else:
            cursor.execute("""
                UPDATE wallets SET balance = balance - ?, updated_at = ?
                WHERE id = ?
            """, (amount, datetime.now().isoformat(), wallet_id))
        conn.commit()


def delete_wallet(wallet_id: int):
    """删除钱包（软删除）"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE wallets SET is_active = 0, updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), wallet_id))
        conn.commit()


# ==================== 交易操作 ====================

def create_transaction(transaction: Transaction) -> int:
    """创建交易记录"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions
            (wallet_id, transaction_type, category, amount, currency, description,
             date, to_wallet_id, is_recurring, recurring_type, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (transaction.wallet_id, transaction.transaction_type, transaction.category,
              transaction.amount, transaction.currency, transaction.description,
              transaction.date.isoformat(), transaction.to_wallet_id,
              transaction.is_recurring, transaction.recurring_type, transaction.tags))
        conn.commit()

        # 更新钱包余额
        if transaction.transaction_type == 'income':
            update_wallet_balance(transaction.wallet_id, transaction.amount, True)
        elif transaction.transaction_type == 'expense':
            update_wallet_balance(transaction.wallet_id, transaction.amount, False)
        elif transaction.transaction_type == 'transfer' and transaction.to_wallet_id:
            update_wallet_balance(transaction.wallet_id, transaction.amount, False)
            update_wallet_balance(transaction.to_wallet_id, transaction.amount, True)

        return cursor.lastrowid


def get_transactions(
    wallet_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100
) -> List[Transaction]:
    """获取交易记录"""
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM transactions WHERE 1=1"
        params = []

        if wallet_id:
            query += " AND wallet_id = ?"
            params.append(wallet_id)
        if transaction_type:
            query += " AND transaction_type = ?"
            params.append(transaction_type)
        if category:
            query += " AND category = ?"
            params.append(category)
        if start_date:
            query += " AND date >= ?"
            params.append(start_date.isoformat())
        if end_date:
            query += " AND date <= ?"
            params.append(end_date.isoformat())

        query += " ORDER BY date DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [Transaction(
            id=row['id'],
            wallet_id=row['wallet_id'],
            transaction_type=row['transaction_type'],
            category=row['category'],
            amount=row['amount'],
            currency=row['currency'],
            description=row['description'] or '',
            date=datetime.fromisoformat(row['date']) if row['date'] else datetime.now(),
            to_wallet_id=row['to_wallet_id'],
            is_recurring=bool(row['is_recurring']),
            recurring_type=row['recurring_type'],
            tags=row['tags'] or '',
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now()
        ) for row in rows]


def delete_transaction(transaction_id: int):
    """删除交易记录（会恢复钱包余额）"""
    with get_connection() as conn:
        cursor = conn.cursor()
        # 先获取交易信息
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
        row = cursor.fetchone()
        if row:
            # 恢复钱包余额
            if row['transaction_type'] == 'income':
                update_wallet_balance(row['wallet_id'], row['amount'], False)
            elif row['transaction_type'] == 'expense':
                update_wallet_balance(row['wallet_id'], row['amount'], True)
            elif row['transaction_type'] == 'transfer' and row['to_wallet_id']:
                update_wallet_balance(row['wallet_id'], row['amount'], True)
                update_wallet_balance(row['to_wallet_id'], row['amount'], False)

            # 删除交易记录
            cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
            conn.commit()


# ==================== 预算操作 ====================

def create_budget(budget: Budget) -> int:
    """创建预算"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO budgets (category, amount, currency, period, start_date, end_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (budget.category, budget.amount, budget.currency, budget.period,
              budget.start_date.isoformat(),
              budget.end_date.isoformat() if budget.end_date else None,
              budget.is_active))
        conn.commit()
        return cursor.lastrowid


def get_budgets(active_only: bool = True) -> List[Budget]:
    """获取所有预算"""
    with get_connection() as conn:
        cursor = conn.cursor()
        if active_only:
            cursor.execute("SELECT * FROM budgets WHERE is_active = 1 ORDER BY category")
        else:
            cursor.execute("SELECT * FROM budgets ORDER BY category")
        rows = cursor.fetchall()
        return [Budget(
            id=row['id'],
            category=row['category'],
            amount=row['amount'],
            currency=row['currency'],
            period=row['period'],
            start_date=datetime.fromisoformat(row['start_date']) if row['start_date'] else datetime.now(),
            end_date=datetime.fromisoformat(row['end_date']) if row['end_date'] else None,
            is_active=bool(row['is_active']),
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now()
        ) for row in rows]


# ==================== 定期交易操作 ====================

def create_recurring_transaction(recurring: RecurringTransaction) -> int:
    """创建定期交易"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO recurring_transactions
            (wallet_id, transaction_type, category, amount, currency, description,
             frequency, day_of_month, month_of_year, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (recurring.wallet_id, recurring.transaction_type, recurring.category,
              recurring.amount, recurring.currency, recurring.description,
              recurring.frequency, recurring.day_of_month, recurring.month_of_year,
              recurring.is_active))
        conn.commit()
        return cursor.lastrowid


def get_recurring_transactions(active_only: bool = True) -> List[RecurringTransaction]:
    """获取所有定期交易"""
    with get_connection() as conn:
        cursor = conn.cursor()
        if active_only:
            cursor.execute("SELECT * FROM recurring_transactions WHERE is_active = 1")
        else:
            cursor.execute("SELECT * FROM recurring_transactions")
        rows = cursor.fetchall()
        return [RecurringTransaction(
            id=row['id'],
            wallet_id=row['wallet_id'],
            transaction_type=row['transaction_type'],
            category=row['category'],
            amount=row['amount'],
            currency=row['currency'],
            description=row['description'] or '',
            frequency=row['frequency'],
            day_of_month=row['day_of_month'],
            month_of_year=row['month_of_year'],
            is_active=bool(row['is_active']),
            last_generated=datetime.fromisoformat(row['last_generated']) if row['last_generated'] else None,
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.now()
        ) for row in rows]


# ==================== 统计功能 ====================

def get_monthly_summary(year: int, month: int) -> dict:
    """获取月度汇总"""
    with get_connection() as conn:
        cursor = conn.cursor()
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"

        # 总收入
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE transaction_type = 'income'
            AND date >= ? AND date < ?
        """, (start_date, end_date))
        total_income = cursor.fetchone()['total']

        # 总支出
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE transaction_type = 'expense'
            AND date >= ? AND date < ?
        """, (start_date, end_date))
        total_expense = cursor.fetchone()['total']

        # 按分类统计支出
        cursor.execute("""
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE transaction_type = 'expense'
            AND date >= ? AND date < ?
            GROUP BY category
            ORDER BY total DESC
        """, (start_date, end_date))
        expense_by_category = {row['category']: row['total'] for row in cursor.fetchall()}

        # 按分类统计收入
        cursor.execute("""
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE transaction_type = 'income'
            AND date >= ? AND date < ?
            GROUP BY category
            ORDER BY total DESC
        """, (start_date, end_date))
        income_by_category = {row['category']: row['total'] for row in cursor.fetchall()}

        return {
            'year': year,
            'month': month,
            'total_income': total_income,
            'total_expense': total_expense,
            'net': total_income - total_expense,
            'expense_by_category': expense_by_category,
            'income_by_category': income_by_category
        }


def get_yearly_summary(year: int) -> dict:
    """获取年度汇总"""
    with get_connection() as conn:
        cursor = conn.cursor()
        start_date = f"{year}-01-01"
        end_date = f"{year + 1}-01-01"

        # 总收入
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE transaction_type = 'income'
            AND date >= ? AND date < ?
        """, (start_date, end_date))
        total_income = cursor.fetchone()['total']

        # 总支出
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE transaction_type = 'expense'
            AND date >= ? AND date < ?
        """, (start_date, end_date))
        total_expense = cursor.fetchone()['total']

        # 按月统计
        monthly_data = []
        for m in range(1, 13):
            monthly_data.append(get_monthly_summary(year, m))

        return {
            'year': year,
            'total_income': total_income,
            'total_expense': total_expense,
            'net': total_income - total_expense,
            'monthly_data': monthly_data
        }


def get_total_balance_by_currency() -> dict:
    """获取各货币总余额"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT currency, SUM(balance) as total
            FROM wallets
            WHERE is_active = 1
            GROUP BY currency
        """)
        return {row['currency']: row['total'] for row in cursor.fetchall()}


def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """货币转换"""
    if from_currency == to_currency:
        return amount
    rate_key = f"{from_currency}_TO_{to_currency}"
    if rate_key in EXCHANGE_RATES:
        return amount * EXCHANGE_RATES[rate_key]
    return amount  # 如果没有找到汇率，返回原金额
