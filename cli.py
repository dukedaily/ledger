"""
命令行界面
Command Line Interface
"""

from datetime import datetime
from typing import Optional

from config import (
    CURRENCIES, WALLET_TYPES, EXPENSE_CATEGORIES,
    INCOME_CATEGORIES, DEFAULT_CURRENCY
)
from models import Wallet, Transaction, Budget, RecurringTransaction
import database as db


def print_header(title: str):
    """打印标题"""
    print("\n" + "=" * 50)
    print(f"  {title}")
    print("=" * 50)


def print_menu(options: list):
    """打印菜单选项"""
    for i, option in enumerate(options, 1):
        print(f"  [{i}] {option}")
    print("  [0] 返回上级菜单")
    print("-" * 50)


def get_input(prompt: str, default: str = None) -> str:
    """获取用户输入"""
    if default:
        result = input(f"{prompt} [{default}]: ").strip()
        return result if result else default
    return input(f"{prompt}: ").strip()


def get_float_input(prompt: str, default: float = None) -> float:
    """获取浮点数输入"""
    while True:
        try:
            if default is not None:
                value = input(f"{prompt} [{default}]: ").strip()
                return float(value) if value else default
            value = input(f"{prompt}: ").strip()
            return float(value)
        except ValueError:
            print("请输入有效的数字！")


def get_int_input(prompt: str, default: int = None) -> int:
    """获取整数输入"""
    while True:
        try:
            if default is not None:
                value = input(f"{prompt} [{default}]: ").strip()
                return int(value) if value else default
            value = input(f"{prompt}: ").strip()
            return int(value)
        except ValueError:
            print("请输入有效的整数！")


def select_currency() -> str:
    """选择货币"""
    print("\n可用货币:")
    currencies = list(CURRENCIES.keys())
    for i, code in enumerate(currencies, 1):
        info = CURRENCIES[code]
        print(f"  [{i}] {code} - {info['name']} ({info['symbol']})")
    choice = get_int_input("选择货币", 1)
    if 1 <= choice <= len(currencies):
        return currencies[choice - 1]
    return DEFAULT_CURRENCY


def select_wallet_type() -> str:
    """选择钱包类型"""
    print("\n钱包类型:")
    types = list(WALLET_TYPES.keys())
    for i, key in enumerate(types, 1):
        print(f"  [{i}] {WALLET_TYPES[key]}")
    choice = get_int_input("选择类型", 1)
    if 1 <= choice <= len(types):
        return types[choice - 1]
    return "cash"


def select_wallet() -> Optional[int]:
    """选择钱包"""
    wallets = db.get_all_wallets()
    if not wallets:
        print("还没有创建任何钱包！")
        return None
    print("\n可用钱包:")
    for i, wallet in enumerate(wallets, 1):
        currency_symbol = CURRENCIES.get(wallet.currency, {}).get('symbol', '')
        print(f"  [{i}] {wallet.name} ({WALLET_TYPES.get(wallet.wallet_type, wallet.wallet_type)}) - "
              f"{currency_symbol}{wallet.balance:.2f}")
    choice = get_int_input("选择钱包", 1)
    if 1 <= choice <= len(wallets):
        return wallets[choice - 1].id
    return None


def select_expense_category() -> str:
    """选择支出分类"""
    print("\n支出分类:")
    categories = list(EXPENSE_CATEGORIES.keys())
    for i, key in enumerate(categories, 1):
        info = EXPENSE_CATEGORIES[key]
        print(f"  [{i}] {info['icon']} {info['name']}")
    choice = get_int_input("选择分类", 1)
    if 1 <= choice <= len(categories):
        return categories[choice - 1]
    return "other_expense"


def select_income_category() -> str:
    """选择收入分类"""
    print("\n收入分类:")
    categories = list(INCOME_CATEGORIES.keys())
    for i, key in enumerate(categories, 1):
        info = INCOME_CATEGORIES[key]
        print(f"  [{i}] {info['icon']} {info['name']}")
    choice = get_int_input("选择分类", 1)
    if 1 <= choice <= len(categories):
        return categories[choice - 1]
    return "other_income"


# ==================== 钱包管理 ====================

def wallet_menu():
    """钱包管理菜单"""
    while True:
        print_header("钱包管理")
        print_menu([
            "查看所有钱包",
            "创建新钱包",
            "删除钱包",
            "查看总资产"
        ])
        choice = get_int_input("请选择操作")

        if choice == 0:
            break
        elif choice == 1:
            view_wallets()
        elif choice == 2:
            create_wallet()
        elif choice == 3:
            delete_wallet()
        elif choice == 4:
            view_total_assets()


def view_wallets():
    """查看所有钱包"""
    print_header("所有钱包")
    wallets = db.get_all_wallets()
    if not wallets:
        print("还没有创建任何钱包。")
        return

    for wallet in wallets:
        currency_info = CURRENCIES.get(wallet.currency, {'symbol': ''})
        wallet_type_name = WALLET_TYPES.get(wallet.wallet_type, wallet.wallet_type)
        print(f"\n  [{wallet.id}] {wallet.name}")
        print(f"      类型: {wallet_type_name}")
        print(f"      余额: {currency_info['symbol']}{wallet.balance:.2f} {wallet.currency}")
        if wallet.description:
            print(f"      备注: {wallet.description}")


def create_wallet():
    """创建新钱包"""
    print_header("创建新钱包")
    name = get_input("钱包名称")
    if not name:
        print("取消创建。")
        return

    wallet_type = select_wallet_type()
    currency = select_currency()
    balance = get_float_input("初始余额", 0.0)
    description = get_input("备注（可选）", "")

    wallet = Wallet(
        name=name,
        wallet_type=wallet_type,
        currency=currency,
        balance=balance,
        description=description
    )
    wallet_id = db.create_wallet(wallet)
    print(f"\n钱包 '{name}' 创建成功！(ID: {wallet_id})")


def delete_wallet():
    """删除钱包"""
    print_header("删除钱包")
    wallet_id = select_wallet()
    if wallet_id:
        confirm = get_input("确认删除? (y/n)", "n")
        if confirm.lower() == 'y':
            db.delete_wallet(wallet_id)
            print("钱包已删除。")


def view_total_assets():
    """查看总资产"""
    print_header("总资产概览")
    balances = db.get_total_balance_by_currency()
    if not balances:
        print("还没有任何资产。")
        return

    print("\n各货币资产:")
    total_in_sgd = 0
    for currency, total in balances.items():
        currency_info = CURRENCIES.get(currency, {'symbol': '', 'name': currency})
        print(f"  {currency_info['name']}: {currency_info['symbol']}{total:.2f}")
        # 转换为SGD计算总资产
        total_in_sgd += db.convert_currency(total, currency, 'SGD')

    print(f"\n总资产(折合SGD): S${total_in_sgd:.2f}")


# ==================== 交易管理 ====================

def transaction_menu():
    """交易管理菜单"""
    while True:
        print_header("交易管理")
        print_menu([
            "记录支出",
            "记录收入",
            "钱包转账",
            "查看交易记录",
            "删除交易记录"
        ])
        choice = get_int_input("请选择操作")

        if choice == 0:
            break
        elif choice == 1:
            record_expense()
        elif choice == 2:
            record_income()
        elif choice == 3:
            wallet_transfer()
        elif choice == 4:
            view_transactions()
        elif choice == 5:
            delete_transaction()


def record_expense():
    """记录支出"""
    print_header("记录支出")
    wallet_id = select_wallet()
    if not wallet_id:
        return

    wallet = db.get_wallet(wallet_id)
    category = select_expense_category()
    amount = get_float_input("金额")

    # 显示分类信息
    cat_info = EXPENSE_CATEGORIES.get(category, {})
    print(f"\n分类: {cat_info.get('icon', '')} {cat_info.get('name', category)}")

    description = get_input("备注（可选）", "")
    date_str = get_input("日期 (YYYY-MM-DD)", datetime.now().strftime("%Y-%m-%d"))

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        date = datetime.now()

    transaction = Transaction(
        wallet_id=wallet_id,
        transaction_type="expense",
        category=category,
        amount=amount,
        currency=wallet.currency,
        description=description,
        date=date
    )
    trans_id = db.create_transaction(transaction)
    print(f"\n支出记录成功！(ID: {trans_id})")


def record_income():
    """记录收入"""
    print_header("记录收入")
    wallet_id = select_wallet()
    if not wallet_id:
        return

    wallet = db.get_wallet(wallet_id)
    category = select_income_category()
    amount = get_float_input("金额")

    cat_info = INCOME_CATEGORIES.get(category, {})
    print(f"\n分类: {cat_info.get('icon', '')} {cat_info.get('name', category)}")

    description = get_input("备注（可选）", "")
    date_str = get_input("日期 (YYYY-MM-DD)", datetime.now().strftime("%Y-%m-%d"))

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        date = datetime.now()

    transaction = Transaction(
        wallet_id=wallet_id,
        transaction_type="income",
        category=category,
        amount=amount,
        currency=wallet.currency,
        description=description,
        date=date
    )
    trans_id = db.create_transaction(transaction)
    print(f"\n收入记录成功！(ID: {trans_id})")


def wallet_transfer():
    """钱包转账"""
    print_header("钱包转账")
    print("选择转出钱包:")
    from_wallet_id = select_wallet()
    if not from_wallet_id:
        return

    print("\n选择转入钱包:")
    to_wallet_id = select_wallet()
    if not to_wallet_id or to_wallet_id == from_wallet_id:
        print("无效的转入钱包！")
        return

    from_wallet = db.get_wallet(from_wallet_id)
    amount = get_float_input("转账金额")
    description = get_input("备注（可选）", "转账")

    transaction = Transaction(
        wallet_id=from_wallet_id,
        transaction_type="transfer",
        category="transfer",
        amount=amount,
        currency=from_wallet.currency,
        description=description,
        date=datetime.now(),
        to_wallet_id=to_wallet_id
    )
    trans_id = db.create_transaction(transaction)
    print(f"\n转账成功！(ID: {trans_id})")


def view_transactions():
    """查看交易记录"""
    print_header("查看交易记录")
    print("\n筛选选项:")
    print("  [1] 查看所有")
    print("  [2] 按钱包筛选")
    print("  [3] 只看支出")
    print("  [4] 只看收入")
    choice = get_int_input("选择", 1)

    wallet_id = None
    trans_type = None

    if choice == 2:
        wallet_id = select_wallet()
    elif choice == 3:
        trans_type = "expense"
    elif choice == 4:
        trans_type = "income"

    transactions = db.get_transactions(
        wallet_id=wallet_id,
        transaction_type=trans_type,
        limit=50
    )

    if not transactions:
        print("\n没有找到交易记录。")
        return

    print(f"\n最近{len(transactions)}条交易记录:")
    print("-" * 60)

    for trans in transactions:
        wallet = db.get_wallet(trans.wallet_id)
        currency_symbol = CURRENCIES.get(trans.currency, {}).get('symbol', '')

        if trans.transaction_type == "expense":
            cat_info = EXPENSE_CATEGORIES.get(trans.category, {'name': trans.category, 'icon': ''})
            type_str = "支出"
            amount_str = f"-{currency_symbol}{trans.amount:.2f}"
        elif trans.transaction_type == "income":
            cat_info = INCOME_CATEGORIES.get(trans.category, {'name': trans.category, 'icon': ''})
            type_str = "收入"
            amount_str = f"+{currency_symbol}{trans.amount:.2f}"
        else:
            cat_info = {'name': '转账', 'icon': '💸'}
            type_str = "转账"
            amount_str = f"{currency_symbol}{trans.amount:.2f}"

        print(f"\n  [{trans.id}] {trans.date.strftime('%Y-%m-%d')} | {type_str}")
        print(f"      {cat_info.get('icon', '')} {cat_info.get('name', trans.category)}")
        print(f"      金额: {amount_str}")
        print(f"      钱包: {wallet.name if wallet else 'Unknown'}")
        if trans.description:
            print(f"      备注: {trans.description}")


def delete_transaction():
    """删除交易记录"""
    print_header("删除交易记录")
    trans_id = get_int_input("输入要删除的交易ID")
    confirm = get_input("确认删除? (y/n)", "n")
    if confirm.lower() == 'y':
        db.delete_transaction(trans_id)
        print("交易记录已删除。")


# ==================== 统计报表 ====================

def report_menu():
    """统计报表菜单"""
    while True:
        print_header("统计报表")
        print_menu([
            "本月统计",
            "本年统计",
            "指定月份统计",
            "指定年份统计"
        ])
        choice = get_int_input("请选择操作")

        if choice == 0:
            break
        elif choice == 1:
            now = datetime.now()
            show_monthly_report(now.year, now.month)
        elif choice == 2:
            show_yearly_report(datetime.now().year)
        elif choice == 3:
            year = get_int_input("年份", datetime.now().year)
            month = get_int_input("月份", datetime.now().month)
            show_monthly_report(year, month)
        elif choice == 4:
            year = get_int_input("年份", datetime.now().year)
            show_yearly_report(year)


def show_monthly_report(year: int, month: int):
    """显示月度报表"""
    summary = db.get_monthly_summary(year, month)

    print_header(f"{year}年{month}月统计报表")

    print(f"\n总收入: S${summary['total_income']:.2f}")
    print(f"总支出: S${summary['total_expense']:.2f}")
    print(f"净收支: S${summary['net']:.2f}")

    if summary['income_by_category']:
        print("\n收入明细:")
        for cat, amount in summary['income_by_category'].items():
            cat_info = INCOME_CATEGORIES.get(cat, {'name': cat, 'icon': ''})
            print(f"  {cat_info.get('icon', '')} {cat_info.get('name', cat)}: S${amount:.2f}")

    if summary['expense_by_category']:
        print("\n支出明细:")
        for cat, amount in summary['expense_by_category'].items():
            cat_info = EXPENSE_CATEGORIES.get(cat, {'name': cat, 'icon': ''})
            print(f"  {cat_info.get('icon', '')} {cat_info.get('name', cat)}: S${amount:.2f}")


def show_yearly_report(year: int):
    """显示年度报表"""
    summary = db.get_yearly_summary(year)

    print_header(f"{year}年度统计报表")

    print(f"\n全年总收入: S${summary['total_income']:.2f}")
    print(f"全年总支出: S${summary['total_expense']:.2f}")
    print(f"全年净收支: S${summary['net']:.2f}")

    print("\n月度概览:")
    print("-" * 50)
    print(f"{'月份':<8}{'收入':>12}{'支出':>12}{'净额':>12}")
    print("-" * 50)

    for monthly in summary['monthly_data']:
        print(f"{monthly['month']:>4}月   "
              f"S${monthly['total_income']:>9.2f} "
              f"S${monthly['total_expense']:>9.2f} "
              f"S${monthly['net']:>9.2f}")


# ==================== 定期交易管理 ====================

def recurring_menu():
    """定期交易管理菜单"""
    while True:
        print_header("定期交易管理")
        print_menu([
            "查看定期交易",
            "创建定期支出",
            "创建定期收入",
            "删除定期交易"
        ])
        choice = get_int_input("请选择操作")

        if choice == 0:
            break
        elif choice == 1:
            view_recurring()
        elif choice == 2:
            create_recurring_expense()
        elif choice == 3:
            create_recurring_income()
        elif choice == 4:
            delete_recurring()


def view_recurring():
    """查看定期交易"""
    print_header("定期交易列表")
    recurring_list = db.get_recurring_transactions()

    if not recurring_list:
        print("还没有设置任何定期交易。")
        return

    for rec in recurring_list:
        wallet = db.get_wallet(rec.wallet_id)
        currency_symbol = CURRENCIES.get(rec.currency, {}).get('symbol', '')

        if rec.transaction_type == "expense":
            cat_info = EXPENSE_CATEGORIES.get(rec.category, {'name': rec.category, 'icon': ''})
            type_str = "支出"
        else:
            cat_info = INCOME_CATEGORIES.get(rec.category, {'name': rec.category, 'icon': ''})
            type_str = "收入"

        freq_str = "每月" if rec.frequency == "monthly" else "每年"
        day_str = f"每月{rec.day_of_month}日" if rec.frequency == "monthly" else f"每年{rec.month_of_year}月{rec.day_of_month}日"

        print(f"\n  [{rec.id}] {cat_info.get('icon', '')} {cat_info.get('name', rec.category)}")
        print(f"      类型: {type_str}")
        print(f"      金额: {currency_symbol}{rec.amount:.2f}")
        print(f"      频率: {freq_str} ({day_str})")
        print(f"      钱包: {wallet.name if wallet else 'Unknown'}")
        if rec.description:
            print(f"      备注: {rec.description}")


def create_recurring_expense():
    """创建定期支出"""
    print_header("创建定期支出")
    wallet_id = select_wallet()
    if not wallet_id:
        return

    wallet = db.get_wallet(wallet_id)
    category = select_expense_category()
    amount = get_float_input("金额")

    print("\n频率:")
    print("  [1] 每月")
    print("  [2] 每年")
    freq_choice = get_int_input("选择", 1)
    frequency = "monthly" if freq_choice == 1 else "yearly"

    day_of_month = get_int_input("每月几号", 1)
    month_of_year = None
    if frequency == "yearly":
        month_of_year = get_int_input("每年几月", 1)

    description = get_input("备注（可选）", "")

    recurring = RecurringTransaction(
        wallet_id=wallet_id,
        transaction_type="expense",
        category=category,
        amount=amount,
        currency=wallet.currency,
        description=description,
        frequency=frequency,
        day_of_month=day_of_month,
        month_of_year=month_of_year
    )
    rec_id = db.create_recurring_transaction(recurring)
    print(f"\n定期支出创建成功！(ID: {rec_id})")


def create_recurring_income():
    """创建定期收入"""
    print_header("创建定期收入")
    wallet_id = select_wallet()
    if not wallet_id:
        return

    wallet = db.get_wallet(wallet_id)
    category = select_income_category()
    amount = get_float_input("金额")

    print("\n频率:")
    print("  [1] 每月")
    print("  [2] 每年")
    freq_choice = get_int_input("选择", 1)
    frequency = "monthly" if freq_choice == 1 else "yearly"

    day_of_month = get_int_input("每月几号", 1)
    month_of_year = None
    if frequency == "yearly":
        month_of_year = get_int_input("每年几月", 1)

    description = get_input("备注（可选）", "")

    recurring = RecurringTransaction(
        wallet_id=wallet_id,
        transaction_type="income",
        category=category,
        amount=amount,
        currency=wallet.currency,
        description=description,
        frequency=frequency,
        day_of_month=day_of_month,
        month_of_year=month_of_year
    )
    rec_id = db.create_recurring_transaction(recurring)
    print(f"\n定期收入创建成功！(ID: {rec_id})")


def delete_recurring():
    """删除定期交易"""
    print_header("删除定期交易")
    view_recurring()
    rec_id = get_int_input("\n输入要删除的定期交易ID")
    confirm = get_input("确认删除? (y/n)", "n")
    if confirm.lower() == 'y':
        # 简单的删除实现
        from database import get_connection
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM recurring_transactions WHERE id = ?", (rec_id,))
            conn.commit()
        print("定期交易已删除。")


# ==================== 预算管理 ====================

def budget_menu():
    """预算管理菜单"""
    while True:
        print_header("预算管理")
        print_menu([
            "查看预算",
            "创建预算",
            "预算使用情况"
        ])
        choice = get_int_input("请选择操作")

        if choice == 0:
            break
        elif choice == 1:
            view_budgets()
        elif choice == 2:
            create_budget()
        elif choice == 3:
            show_budget_usage()


def view_budgets():
    """查看预算"""
    print_header("预算列表")
    budgets = db.get_budgets()

    if not budgets:
        print("还没有设置任何预算。")
        return

    for budget in budgets:
        cat_info = EXPENSE_CATEGORIES.get(budget.category, {'name': budget.category, 'icon': ''})
        currency_symbol = CURRENCIES.get(budget.currency, {}).get('symbol', '')
        period_str = "每月" if budget.period == "monthly" else "每年"

        print(f"\n  [{budget.id}] {cat_info.get('icon', '')} {cat_info.get('name', budget.category)}")
        print(f"      预算金额: {currency_symbol}{budget.amount:.2f} ({period_str})")


def create_budget():
    """创建预算"""
    print_header("创建预算")
    category = select_expense_category()
    amount = get_float_input("预算金额")
    currency = select_currency()

    print("\n预算周期:")
    print("  [1] 每月")
    print("  [2] 每年")
    period_choice = get_int_input("选择", 1)
    period = "monthly" if period_choice == 1 else "yearly"

    budget = Budget(
        category=category,
        amount=amount,
        currency=currency,
        period=period,
        start_date=datetime.now()
    )
    budget_id = db.create_budget(budget)
    print(f"\n预算创建成功！(ID: {budget_id})")


def show_budget_usage():
    """显示预算使用情况"""
    print_header("预算使用情况")
    budgets = db.get_budgets()

    if not budgets:
        print("还没有设置任何预算。")
        return

    now = datetime.now()
    summary = db.get_monthly_summary(now.year, now.month)
    expense_by_cat = summary['expense_by_category']

    print(f"\n{now.year}年{now.month}月预算使用情况:\n")

    for budget in budgets:
        cat_info = EXPENSE_CATEGORIES.get(budget.category, {'name': budget.category, 'icon': ''})
        currency_symbol = CURRENCIES.get(budget.currency, {}).get('symbol', '')

        used = expense_by_cat.get(budget.category, 0)
        budget_amount = budget.amount if budget.period == "monthly" else budget.amount / 12

        percentage = (used / budget_amount * 100) if budget_amount > 0 else 0
        remaining = budget_amount - used

        # 进度条
        bar_length = 20
        filled = int(bar_length * min(percentage, 100) / 100)
        bar = "█" * filled + "░" * (bar_length - filled)

        status = "✓" if percentage <= 100 else "⚠️ 超支"

        print(f"  {cat_info.get('icon', '')} {cat_info.get('name', budget.category)}")
        print(f"    [{bar}] {percentage:.1f}%")
        print(f"    已用: {currency_symbol}{used:.2f} / {currency_symbol}{budget_amount:.2f}")
        print(f"    剩余: {currency_symbol}{remaining:.2f} {status}")
        print()


# ==================== 主菜单 ====================

def main_menu():
    """主菜单"""
    while True:
        print_header("个人账本 Personal Ledger")
        print_menu([
            "钱包管理",
            "交易管理",
            "统计报表",
            "定期交易",
            "预算管理",
            "退出程序"
        ])
        choice = get_int_input("请选择操作")

        if choice == 0 or choice == 6:
            print("\n再见！祝您财务自由！")
            break
        elif choice == 1:
            wallet_menu()
        elif choice == 2:
            transaction_menu()
        elif choice == 3:
            report_menu()
        elif choice == 4:
            recurring_menu()
        elif choice == 5:
            budget_menu()
