'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/', label: '仪表盘', icon: '📊' },
  { href: '/wallets', label: '钱包管理', icon: '💰' },
  { href: '/transactions', label: '交易记录', icon: '📝' },
  { href: '/budgets', label: '预算管理', icon: '🎯' },
  { href: '/reports', label: '统计报表', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          💰 个人账本
        </h1>
        <p className="text-gray-400 text-sm mt-1">Personal Ledger</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-xs text-gray-500">
          <p>支持货币</p>
          <p className="mt-1">🇺🇸 USD | 🇸🇬 SGD | 🇨🇳 RMB</p>
        </div>
      </div>
    </aside>
  );
}
