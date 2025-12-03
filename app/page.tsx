'use client';

import { useState, useEffect } from 'react';
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency, convertCurrency } from '@/lib/config';
import type { Wallet, Transaction, MonthlySummary } from '@/lib/types';

export default function Dashboard() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletsRes, transRes, summaryRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch('/api/transactions?limit=10'),
        fetch('/api/summary'),
      ]);
      setWallets(await walletsRes.json());
      setTransactions(await transRes.json());
      setSummary(await summaryRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算总资产（折合SGD）
  const totalBalanceSGD = wallets.reduce((total, wallet) => {
    return total + convertCurrency(wallet.balance, wallet.currency, 'SGD');
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <p className="text-sm opacity-80">总资产 (SGD)</p>
          <p className="text-3xl font-bold mt-2">S${totalBalanceSGD.toFixed(2)}</p>
          <p className="text-sm mt-2 opacity-80">{wallets.length} 个钱包</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">本月收入</p>
          <p className="text-3xl font-bold mt-2">S${summary?.total_income.toFixed(2) || '0.00'}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <p className="text-sm opacity-80">本月支出</p>
          <p className="text-3xl font-bold mt-2">S${summary?.total_expense.toFixed(2) || '0.00'}</p>
        </div>

        <div className={`card bg-gradient-to-br ${(summary?.net || 0) >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
          <p className="text-sm opacity-80">本月净收支</p>
          <p className="text-3xl font-bold mt-2">S${summary?.net.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 钱包列表 */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">我的钱包</h2>
          {wallets.length === 0 ? (
            <p className="text-gray-500">还没有创建钱包，去创建一个吧！</p>
          ) : (
            <div className="space-y-3">
              {wallets.slice(0, 5).map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {wallet.wallet_type === 'cash' && '💵'}
                      {wallet.wallet_type === 'bank' && '🏦'}
                      {wallet.wallet_type === 'credit' && '💳'}
                      {wallet.wallet_type === 'digital' && '📱'}
                      {wallet.wallet_type === 'crypto' && '₿'}
                      {wallet.wallet_type === 'investment' && '📈'}
                    </span>
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-sm text-gray-500">{wallet.currency}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(wallet.balance, wallet.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近交易 */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">最近交易</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">还没有交易记录</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((trans) => {
                const isExpense = trans.transaction_type === 'expense';
                const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
                const catInfo = categories[trans.category as keyof typeof categories] || { name: trans.category, icon: '📝' };

                return (
                  <div key={trans.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{catInfo.icon}</span>
                      <div>
                        <p className="font-medium">{catInfo.name}</p>
                        <p className="text-sm text-gray-500">{trans.date.split('T')[0]}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(trans.amount, trans.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 本月支出分类 */}
      {summary && Object.keys(summary.expense_by_category).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">本月支出分类</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.expense_by_category).map(([cat, amount]) => {
              const catInfo = EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES] || { name: cat, icon: '📝' };
              const percentage = ((amount / summary.total_expense) * 100).toFixed(1);
              return (
                <div key={cat} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{catInfo.icon}</span>
                    <span className="font-medium">{catInfo.name}</span>
                  </div>
                  <p className="text-xl font-bold text-red-600">S${amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
