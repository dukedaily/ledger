'use client';

import { useState, useEffect } from 'react';
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency } from '@/lib/config';
import type { Wallet, Transaction } from '@/lib/types';

type TransactionType = 'income' | 'expense' | 'transfer';

export default function TransactionsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const [formData, setFormData] = useState({
    wallet_id: 0,
    transaction_type: 'expense' as TransactionType,
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    to_wallet_id: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletsRes, transRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch('/api/transactions?limit=100'),
      ]);
      const walletsData = await walletsRes.json();
      setWallets(walletsData);
      setTransactions(await transRes.json());
      if (walletsData.length > 0) {
        setFormData(prev => ({ ...prev, wallet_id: walletsData[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          wallet_id: wallets[0]?.id || 0,
          transaction_type: 'expense',
          category: '',
          amount: 0,
          description: '',
          date: new Date().toISOString().split('T')[0],
          to_wallet_id: 0,
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条交易记录吗？')) return;
    try {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const currentCategories = formData.transaction_type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.transaction_type === filterType);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">加载中...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">交易记录</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? '取消' : '+ 记一笔'}
        </button>
      </div>

      {/* 创建表单 */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">添加交易</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 交易类型选择 */}
            <div className="flex gap-2">
              {(['expense', 'income', 'transfer'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, transaction_type: type, category: '' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.transaction_type === type
                      ? type === 'expense' ? 'bg-red-500 text-white' :
                        type === 'income' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'expense' ? '💸 支出' : type === 'income' ? '💰 收入' : '🔄 转账'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">选择钱包</label>
                <select
                  className="select"
                  value={formData.wallet_id}
                  onChange={(e) => setFormData({ ...formData, wallet_id: parseInt(e.target.value) })}
                  required
                >
                  <option value="">请选择钱包</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})
                    </option>
                  ))}
                </select>
              </div>

              {formData.transaction_type === 'transfer' ? (
                <div>
                  <label className="label">转入钱包</label>
                  <select
                    className="select"
                    value={formData.to_wallet_id}
                    onChange={(e) => setFormData({ ...formData, to_wallet_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">请选择钱包</option>
                    {wallets.filter(w => w.id !== formData.wallet_id).map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label">分类</label>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">请选择分类</option>
                    {Object.entries(currentCategories).map(([key, { name, icon }]) => (
                      <option key={key} value={key}>{icon} {name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">金额</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="label">日期</label>
                <input
                  type="date"
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">备注（可选）</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="备注信息"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 筛选器 */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: '全部' },
          { value: 'expense', label: '💸 支出' },
          { value: 'income', label: '💰 收入' },
          { value: 'transfer', label: '🔄 转账' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterType(option.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === option.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 交易列表 */}
      {filteredTransactions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">没有交易记录</p>
          <p className="text-gray-400 mt-2">点击上方按钮添加第一笔交易</p>
        </div>
      ) : (
        <div className="card">
          <div className="space-y-3">
            {filteredTransactions.map((trans) => {
              const wallet = wallets.find(w => w.id === trans.wallet_id);
              const isExpense = trans.transaction_type === 'expense';
              const isTransfer = trans.transaction_type === 'transfer';
              const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
              const catInfo = isTransfer
                ? { name: '转账', icon: '🔄' }
                : (categories[trans.category as keyof typeof categories] || { name: trans.category, icon: '📝' });

              return (
                <div key={trans.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{catInfo.icon}</span>
                    <div>
                      <p className="font-medium">{catInfo.name}</p>
                      <p className="text-sm text-gray-500">
                        {wallet?.name || '未知钱包'} • {trans.date.split('T')[0]}
                      </p>
                      {trans.description && (
                        <p className="text-sm text-gray-400">{trans.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-xl font-bold ${
                      isExpense ? 'text-red-600' : isTransfer ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {isExpense ? '-' : isTransfer ? '' : '+'}{formatCurrency(trans.amount, trans.currency)}
                    </p>
                    <button
                      onClick={() => handleDelete(trans.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
