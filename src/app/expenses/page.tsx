'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  XCircle,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ExpenseList } from '@/components/expense-list';
import { getCategoryByKey } from '@/lib/categories';

interface ExpenseStats {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  totalCount: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    type: string;
    total: number;
    count: number;
  }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
};

const CHART_COLORS = [
  '#f97316', '#3b82f6', '#eab308', '#ec4899', '#ef4444',
  '#8b5cf6', '#6366f1', '#14b8a6', '#6b7280', '#10b981',
  '#06b6d4', '#2563eb', '#059669', '#d946ef',
];

export default function ExpensesPage() {
  const { data: session } = useSession();

  const { data: stats, error, isLoading, mutate } = useSWR<ExpenseStats>(
    '/api/expenses/stats',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <div className="bg-black flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center space-x-2 text-white">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-white">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-400 mb-4">ไม่สามารถโหลดข้อมูลได้</p>
          <Button onClick={() => mutate()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  // Prepare pie chart data for expense categories
  const expenseCategoryData = (stats?.categoryBreakdown || [])
    .filter((c) => c.type === 'expense')
    .map((c, i) => ({
      name: getCategoryByKey(c.category)?.label || c.category,
      value: c.total,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 pt-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              รายรับรายจ่าย
            </h1>
            <p className="text-gray-400 mt-1">
              ยินดีต้อนรับ, {session?.user?.username}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => mutate()}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            <Link href="/expenses/new">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="relative p-2 border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">รายรับทั้งหมด</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(stats?.incomeTotal || 0)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{stats?.incomeCount || 0} รายการ</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="relative p-2 border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">รายจ่ายทั้งหมด</p>
                  <p className="text-lg font-bold text-red-400">
                    {formatCurrency(stats?.expenseTotal || 0)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{stats?.expenseCount || 0} รายการ</p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="relative p-2 border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">ยอดคงเหลือ</p>
                  <p className={`text-lg font-bold ${(stats?.balance || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(stats?.balance || 0)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{stats?.totalCount || 0} รายการทั้งหมด</p>
                </div>
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Bar Chart */}
          <Card className="relative p-2 border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-lg" />
            <div className="relative p-4">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">สถิติรายเดือน</h3>
              </div>
              {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="income" fill="#10B981" name="รายรับ" />
                    <Bar dataKey="expense" fill="#EF4444" name="รายจ่าย" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่มีข้อมูลแสดง</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Category Pie Chart */}
          <Card className="relative p-2 border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-rose-500/5 rounded-lg" />
            <div className="relative p-4">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">สัดส่วนรายจ่าย</h3>
              </div>
              {expenseCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่มีข้อมูลแสดง</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Expense List */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">รายการทั้งหมด</h2>
          <ExpenseList />
        </div>
      </div>
    </div>
  );
}
