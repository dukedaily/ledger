'use client';

import { useState, useEffect } from 'react';
import { CURRENCIES, EXPENSE_CATEGORIES, formatCurrency } from '@/lib/config';
import type { Budget, MonthlySummary, CurrencyCode } from '@/lib/types';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    currency: 'SGD' as CurrencyCode,
    period: 'monthly' as 'monthly' | 'yearly',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetsRes, summaryRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/summary'),
      ]);
      setBudgets(await budgetsRes.json());
      setSummary(await summaryRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ category: '', amount: 0, currency: 'SGD', period: 'monthly' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个预算吗？')) return;
    try {
      await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">加载中...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">预算管理</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? '取消' : '+ 设置预算'}
        </button>
      </div>

      {/* 创建表单 */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">设置新预算</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">支出分类</label>
                <select
                  className="select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">请选择分类</option>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, { name, icon }]) => (
                    <option key={key} value={key}>{icon} {name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">预算金额</label>
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
                <label className="label">预算周期</label>
                <select
                  className="select"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'yearly' })}
                >
                  <option value="monthly">每月</option>
                  <option value="yearly">每年</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">保存预算</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 预算使用情况 */}
      {budgets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">还没有设置任何预算</p>
          <p className="text-gray-400 mt-2">点击上方按钮设置第一个预算</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const catInfo = EXPENSE_CATEGORIES[budget.category as keyof typeof EXPENSE_CATEGORIES] ||
              { name: budget.category, icon: '📝' };
            const spent = summary?.expense_by_category[budget.category] || 0;
            const budgetAmount = budget.period === 'monthly' ? budget.amount : budget.amount / 12;
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
            const remaining = budgetAmount - spent;
            const isOverBudget = percentage > 100;

            return (
              <div key={budget.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{catInfo.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{catInfo.name}</h3>
                      <p className="text-sm text-gray-500">
                        {budget.period === 'monthly' ? '每月预算' : '每年预算'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="删除预算"
                  >
                    🗑️
                  </button>
                </div>

                {/* 进度条 */}
                <div className="mb-3">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    已用: {formatCurrency(spent, budget.currency)}
                  </span>
                  <span className="text-gray-500">
                    预算: {formatCurrency(budgetAmount, budget.currency)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {isOverBudget ? '超支' : '剩余'}: {formatCurrency(Math.abs(remaining), budget.currency)}
                  </span>
                  <span className={`text-sm font-medium ${
                    isOverBudget ? 'text-red-600' : percentage > 80 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
