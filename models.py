"""
数据模型定义
Data Models
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum


class TransactionType(Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


@dataclass
class Wallet:
    """钱包模型"""
    id: Optional[int] = None
    name: str = ""
    wallet_type: str = "cash"  # cash, bank, credit, digital, crypto, investment
    currency: str = "SGD"
    balance: float = 0.0
    description: str = ""
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class Transaction:
    """交易记录模型"""
    id: Optional[int] = None
    wallet_id: int = 0
    transaction_type: str = "expense"  # income, expense, transfer
    category: str = ""
    amount: float = 0.0
    currency: str = "SGD"
    description: str = ""
    date: datetime = field(default_factory=datetime.now)
    # 用于转账
    to_wallet_id: Optional[int] = None
    # 标记是否为定期支出
    is_recurring: bool = False
    recurring_type: Optional[str] = None  # monthly, yearly
    tags: str = ""  # 标签，用逗号分隔
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Budget:
    """预算模型"""
    id: Optional[int] = None
    category: str = ""
    amount: float = 0.0
    currency: str = "SGD"
    period: str = "monthly"  # monthly, yearly
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class RecurringTransaction:
    """定期交易模型（用于自动生成交易）"""
    id: Optional[int] = None
    wallet_id: int = 0
    transaction_type: str = "expense"
    category: str = ""
    amount: float = 0.0
    currency: str = "SGD"
    description: str = ""
    frequency: str = "monthly"  # monthly, yearly
    day_of_month: int = 1  # 每月几号
    month_of_year: Optional[int] = None  # 每年几月（仅yearly使用）
    is_active: bool = True
    last_generated: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
