'use client';

import { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/config';

interface MonthlySummary {
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
  net: number;
  expense_by_category: Record<string, number>;
  income_by_category: Record<string, number>;
}

interface YearlySummary {
  year: number;
  total_income: number;
  total_expense: number;
  net: number;
  monthly_data: MonthlySummary[];
}

export default function ReportsPage() {
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [viewType, year, month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewType === 'monthly') {
        const res = await fetch(`/api/summary?type=monthly&year=${year}&month=${month}`);
        setMonthlySummary(await res.json());
      } else {
        const res = await fetch(`/api/summary?type=yearly&year=${year}`);
        setYearlySummary(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">统计报表</h1>

      {/* 筛选器 */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              月度报表
            </button>
            <button
              onClick={() => setViewType('yearly')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'yearly' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              年度报表
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <select
              className="select w-auto"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>

            {viewType === 'monthly' && (
              <select
                className="select w-auto"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : viewType === 'monthly' && monthlySummary ? (
        <MonthlyReport summary={monthlySummary} />
      ) : viewType === 'yearly' && yearlySummary ? (
        <YearlyReport summary={yearlySummary} />
      ) : null}
    </div>
  );
}

function MonthlyReport({ summary }: { summary: MonthlySummary }) {
  const hasExpenses = Object.keys(summary.expense_by_category).length > 0;
  const hasIncome = Object.keys(summary.income_by_category).length > 0;

  return (
    <div className="space-y-6">
      {/* 概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">总收入</p>
          <p className="text-3xl font-bold mt-2">S${summary.total_income.toFixed(2)}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <p className="text-sm opacity-80">总支出</p>
          <p className="text-3xl font-bold mt-2">S${summary.total_expense.toFixed(2)}</p>
        </div>
        <div className={`card bg-gradient-to-br ${summary.net >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
          <p className="text-sm opacity-80">净收支</p>
          <p className="text-3xl font-bold mt-2">S${summary.net.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 支出明细 */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">支出明细</h2>
          {!hasExpenses ? (
            <p className="text-gray-500">本月暂无支出</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(summary.expense_by_category)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const catInfo = EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES] ||
                    { name: category, icon: '📝' };
                  const percentage = ((amount / summary.total_expense) * 100).toFixed(1);

                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-2xl">{catInfo.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{catInfo.name}</span>
                          <span className="text-red-600 font-semibold">S${amount.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* 收入明细 */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">收入明细</h2>
          {!hasIncome ? (
            <p className="text-gray-500">本月暂无收入</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(summary.income_by_category)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const catInfo = INCOME_CATEGORIES[category as keyof typeof INCOME_CATEGORIES] ||
                    { name: category, icon: '💰' };
                  const percentage = ((amount / summary.total_income) * 100).toFixed(1);

                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-2xl">{catInfo.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{catInfo.name}</span>
                          <span className="text-green-600 font-semibold">S${amount.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function YearlyReport({ summary }: { summary: YearlySummary }) {
  const maxMonthlyExpense = Math.max(...summary.monthly_data.map(m => m.total_expense), 1);
  const maxMonthlyIncome = Math.max(...summary.monthly_data.map(m => m.total_income), 1);

  return (
    <div className="space-y-6">
      {/* 年度概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">全年总收入</p>
          <p className="text-3xl font-bold mt-2">S${summary.total_income.toFixed(2)}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <p className="text-sm opacity-80">全年总支出</p>
          <p className="text-3xl font-bold mt-2">S${summary.total_expense.toFixed(2)}</p>
        </div>
        <div className={`card bg-gradient-to-br ${summary.net >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
          <p className="text-sm opacity-80">全年净收支</p>
          <p className="text-3xl font-bold mt-2">S${summary.net.toFixed(2)}</p>
        </div>
      </div>

      {/* 月度趋势 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">月度趋势</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">月份</th>
                <th className="text-right py-3 px-4">收入</th>
                <th className="text-right py-3 px-4">支出</th>
                <th className="text-right py-3 px-4">净收支</th>
                <th className="py-3 px-4 w-48">收支对比</th>
              </tr>
            </thead>
            <tbody>
              {summary.monthly_data.map((m) => (
                <tr key={m.month} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{m.month}月</td>
                  <td className="text-right py-3 px-4 text-green-600">
                    S${m.total_income.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-red-600">
                    S${m.total_expense.toFixed(2)}
                  </td>
                  <td className={`text-right py-3 px-4 font-semibold ${m.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    S${m.net.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 h-4">
                      <div
                        className="bg-green-500 rounded"
                        style={{ width: `${(m.total_income / maxMonthlyIncome) * 100}%` }}
                        title={`收入: S$${m.total_income.toFixed(2)}`}
                      />
                      <div
                        className="bg-red-500 rounded"
                        style={{ width: `${(m.total_expense / maxMonthlyExpense) * 100}%` }}
                        title={`支出: S$${m.total_expense.toFixed(2)}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="py-3 px-4">合计</td>
                <td className="text-right py-3 px-4 text-green-600">
                  S${summary.total_income.toFixed(2)}
                </td>
                <td className="text-right py-3 px-4 text-red-600">
                  S${summary.total_expense.toFixed(2)}
                </td>
                <td className={`text-right py-3 px-4 ${summary.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  S${summary.net.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
