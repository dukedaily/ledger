// 货币配置
export const CURRENCIES = {
  USD: { name: '美元', symbol: '$', flag: '🇺🇸' },
  SGD: { name: '新加坡元', symbol: 'S$', flag: '🇸🇬' },
  RMB: { name: '人民币', symbol: '¥', flag: '🇨🇳' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// 钱包类型
export const WALLET_TYPES = {
  cash: { name: '现金', icon: '💵' },
  bank: { name: '银行卡', icon: '🏦' },
  credit: { name: '信用卡', icon: '💳' },
  digital: { name: '数字钱包', icon: '📱' },
  crypto: { name: '加密货币', icon: '₿' },
  investment: { name: '投资账户', icon: '📈' },
} as const;

export type WalletType = keyof typeof WALLET_TYPES;

// 支出分类
export const EXPENSE_CATEGORIES = {
  // 固定月度支出
  child_support: { name: '抚养费', frequency: 'monthly', icon: '👶' },
  parent_support: { name: '赡养费', frequency: 'monthly', icon: '👨‍👩‍👦' },
  insurance: { name: '保险', frequency: 'monthly', icon: '🛡️' },
  tax: { name: '税收', frequency: 'monthly', icon: '📋' },
  rent: { name: '房租', frequency: 'monthly', icon: '🏠' },
  utilities: { name: '水电网费', frequency: 'monthly', icon: '💡' },

  // 日常支出
  massage: { name: '按摩/保健', frequency: 'flexible', icon: '💆' },
  entertainment: { name: '娱乐', frequency: 'flexible', icon: '🎮' },
  digital_products: { name: '数码产品', frequency: 'flexible', icon: '📱' },
  food: { name: '餐饮', frequency: 'flexible', icon: '🍜' },
  transport: { name: '交通', frequency: 'flexible', icon: '🚗' },
  shopping: { name: '购物', frequency: 'flexible', icon: '🛒' },

  // 年度支出
  travel: { name: '旅游', frequency: 'yearly', icon: '✈️' },
  gifts: { name: '节日礼物', frequency: 'yearly', icon: '🎁' },

  // 其他
  other_expense: { name: '其他支出', frequency: 'flexible', icon: '📝' },
} as const;

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES;

// 收入分类
export const INCOME_CATEGORIES = {
  salary: { name: '工资', frequency: 'monthly', icon: '💰' },
  investment: { name: '投资收益', frequency: 'flexible', icon: '📈' },
  crypto: { name: '数字货币收益', frequency: 'flexible', icon: '₿' },
  insurance_return: { name: '保险理财', frequency: 'flexible', icon: '🏦' },
  bonus: { name: '奖金', frequency: 'flexible', icon: '🎉' },
  other_income: { name: '其他收入', frequency: 'flexible', icon: '💵' },
} as const;

export type IncomeCategory = keyof typeof INCOME_CATEGORIES;

// 汇率
export const EXCHANGE_RATES: Record<string, number> = {
  USD_TO_SGD: 1.34,
  USD_TO_RMB: 7.24,
  SGD_TO_USD: 0.75,
  SGD_TO_RMB: 5.40,
  RMB_TO_USD: 0.14,
  RMB_TO_SGD: 0.19,
};

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  const rateKey = `${from}_TO_${to}`;
  const rate = EXCHANGE_RATES[rateKey] || 1;
  return amount * rate;
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const { symbol } = CURRENCIES[currency];
  return `${symbol}${amount.toFixed(2)}`;
}
