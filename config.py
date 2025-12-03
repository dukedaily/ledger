"""
个人账本配置文件
Personal Ledger Configuration
"""

# 支持的货币类型
CURRENCIES = {
    "USD": {"name": "美元", "symbol": "$"},
    "SGD": {"name": "新加坡元", "symbol": "S$"},
    "RMB": {"name": "人民币", "symbol": "¥"},
}

# 默认货币
DEFAULT_CURRENCY = "SGD"

# 钱包类型
WALLET_TYPES = {
    "cash": "现金",
    "bank": "银行卡",
    "credit": "信用卡",
    "digital": "数字钱包",
    "crypto": "加密货币钱包",
    "investment": "投资账户",
}

# 支出分类
EXPENSE_CATEGORIES = {
    # 固定月度支出
    "child_support": {"name": "抚养费", "frequency": "monthly", "icon": "👶"},
    "parent_support": {"name": "赡养费", "frequency": "monthly", "icon": "👨‍👩‍👦"},
    "insurance": {"name": "保险", "frequency": "monthly", "icon": "🛡️"},
    "tax": {"name": "税收", "frequency": "monthly", "icon": "📋"},
    "rent": {"name": "房租", "frequency": "monthly", "icon": "🏠"},

    # 日常支出
    "massage": {"name": "按摩/保健", "frequency": "flexible", "icon": "💆"},
    "entertainment": {"name": "娱乐", "frequency": "flexible", "icon": "🎮"},
    "digital_products": {"name": "数码产品", "frequency": "flexible", "icon": "📱"},
    "food": {"name": "餐饮", "frequency": "flexible", "icon": "🍜"},
    "transport": {"name": "交通", "frequency": "flexible", "icon": "🚗"},
    "shopping": {"name": "购物", "frequency": "flexible", "icon": "🛒"},
    "utilities": {"name": "水电网费", "frequency": "monthly", "icon": "💡"},

    # 年度支出
    "travel": {"name": "旅游", "frequency": "yearly", "icon": "✈️"},
    "gifts": {"name": "节日礼物", "frequency": "yearly", "icon": "🎁"},

    # 其他
    "other_expense": {"name": "其他支出", "frequency": "flexible", "icon": "📝"},
}

# 收入分类
INCOME_CATEGORIES = {
    "salary": {"name": "工资", "frequency": "monthly", "icon": "💰"},
    "investment": {"name": "投资收益", "frequency": "flexible", "icon": "📈"},
    "crypto": {"name": "数字货币收益", "frequency": "flexible", "icon": "₿"},
    "insurance_return": {"name": "保险理财", "frequency": "flexible", "icon": "🏦"},
    "bonus": {"name": "奖金", "frequency": "flexible", "icon": "🎉"},
    "other_income": {"name": "其他收入", "frequency": "flexible", "icon": "💵"},
}

# 重要节日（用于提醒礼物支出）
HOLIDAYS = {
    "spring_festival": {"name": "春节", "month": 1, "day": None},  # 农历
    "mothers_day": {"name": "母亲节", "month": 5, "day": None},  # 5月第二个周日
    "fathers_day": {"name": "父亲节", "month": 6, "day": None},  # 6月第三个周日
    "mid_autumn": {"name": "中秋节", "month": 9, "day": None},  # 农历
    "christmas": {"name": "圣诞节", "month": 12, "day": 25},
    "new_year": {"name": "元旦", "month": 1, "day": 1},
}

# 数据库配置
DATABASE_PATH = "ledger.db"

# 汇率（可手动更新或接入API）
EXCHANGE_RATES = {
    "USD_TO_SGD": 1.34,
    "USD_TO_RMB": 7.24,
    "SGD_TO_USD": 0.75,
    "SGD_TO_RMB": 5.40,
    "RMB_TO_USD": 0.14,
    "RMB_TO_SGD": 0.19,
}
