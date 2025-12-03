'use client';

import { useState, useEffect } from 'react';
import { CURRENCIES, WALLET_TYPES, formatCurrency } from '@/lib/config';
import type { Wallet, CurrencyCode, WalletType } from '@/lib/types';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    wallet_type: 'bank' as WalletType,
    currency: 'SGD' as CurrencyCode,
    balance: 0,
    description: '',
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const res = await fetch('/api/wallets');
      setWallets(await res.json());
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', wallet_type: 'bank', currency: 'SGD', balance: 0, description: '' });
        fetchWallets();
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个钱包吗？')) return;
    try {
      await fetch(`/api/wallets?id=${id}`, { method: 'DELETE' });
      fetchWallets();
    } catch (error) {
      console.error('Failed to delete wallet:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">加载中...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">钱包管理</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? '取消' : '+ 创建钱包'}
        </button>
      </div>

      {/* 创建表单 */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">创建新钱包</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">钱包名称</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：工资卡"
                  required
                />
              </div>

              <div>
                <label className="label">钱包类型</label>
                <select
                  className="select"
                  value={formData.wallet_type}
                  onChange={(e) => setFormData({ ...formData, wallet_type: e.target.value as WalletType })}
                >
                  {Object.entries(WALLET_TYPES).map(([key, { name, icon }]) => (
                    <option key={key} value={key}>{icon} {name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">货币</label>
                <select
                  className="select"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                >
                  {Object.entries(CURRENCIES).map(([code, { name, flag }]) => (
                    <option key={code} value={code}>{flag} {code} - {name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">初始余额</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
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
              <button type="submit" className="btn btn-primary">创建钱包</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 钱包列表 */}
      {wallets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">还没有创建任何钱包</p>
          <p className="text-gray-400 mt-2">点击上方按钮创建第一个钱包</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => {
            const typeInfo = WALLET_TYPES[wallet.wallet_type] || { name: wallet.wallet_type, icon: '💰' };
            const currencyInfo = CURRENCIES[wallet.currency] || { name: wallet.currency, flag: '' };

            return (
              <div key={wallet.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{typeInfo.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{wallet.name}</h3>
                      <p className="text-sm text-gray-500">{typeInfo.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(wallet.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="删除钱包"
                  >
                    🗑️
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">余额</p>
                  <p className={`text-2xl font-bold ${wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(wallet.balance, wallet.currency)}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <span>{currencyInfo.flag}</span>
                  <span>{wallet.currency}</span>
                </div>

                {wallet.description && (
                  <p className="mt-2 text-sm text-gray-400">{wallet.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
