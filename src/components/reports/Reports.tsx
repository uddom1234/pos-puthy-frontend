import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface SalesSummary {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  transactionCount: number;
}

const Reports: React.FC = () => {
  const [dailySummary, setDailySummary] = useState<SalesSummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [dailyData, monthlyData] = await Promise.all([
        reportsAPI.getSalesSummary('daily'),
        reportsAPI.getSalesSummary('monthly'),
      ]);

      setDailySummary(dailyData);
      setMonthlySummary(monthlyData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Mock export functionality
    const data = selectedPeriod === 'daily' ? dailySummary : monthlySummary;
    if (!data) return;

    const exportData = {
      period: data.period,
      summary: {
        totalRevenue: data.totalRevenue,
        totalExpenses: data.totalExpenses,
        netProfit: data.netProfit,
        transactionCount: data.transactionCount,
      },
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mock data for charts
  const revenueData = [
    { name: 'Mon', revenue: 1200, expenses: 800 },
    { name: 'Tue', revenue: 1500, expenses: 900 },
    { name: 'Wed', revenue: 1800, expenses: 700 },
    { name: 'Thu', revenue: 2200, expenses: 1100 },
    { name: 'Fri', revenue: 2800, expenses: 1200 },
    { name: 'Sat', revenue: 3200, expenses: 1300 },
    { name: 'Sun', revenue: 2600, expenses: 1000 },
  ];

  const categoryData = [
    { name: 'Coffee', value: 45, color: '#8B5CF6' },
    { name: 'Food', value: 35, color: '#06B6D4' },
    { name: 'Beverages', value: 15, color: '#10B981' },
    { name: 'Desserts', value: 5, color: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentSummary = selectedPeriod === 'daily' ? dailySummary : monthlySummary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="input-field min-w-0"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="btn-outline flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {currentSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900">Total Revenue</h3>
            <p className="text-3xl font-bold text-blue-600">${currentSummary.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-blue-700 mt-1">{selectedPeriod} period</p>
          </div>
          <div className="card p-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-900">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-600">${currentSummary.totalExpenses.toFixed(2)}</p>
            <p className="text-sm text-red-700 mt-1">{selectedPeriod} period</p>
          </div>
          <div className="card p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-900">Net Profit</h3>
            <p className="text-3xl font-bold text-green-600">${currentSummary.netProfit.toFixed(2)}</p>
            <p className="text-sm text-green-700 mt-1">
              Margin: {((currentSummary.netProfit / currentSummary.totalRevenue) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="card p-6 bg-purple-50 border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900">Transactions</h3>
            <p className="text-3xl font-bold text-purple-600">{currentSummary.transactionCount}</p>
            <p className="text-sm text-purple-700 mt-1">
              Avg: ${(currentSummary.totalRevenue / currentSummary.transactionCount).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, '']} />
                <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentSummary ? (currentSummary.totalRevenue / currentSummary.transactionCount).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-gray-600">Average Order Value</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {currentSummary ? ((currentSummary.netProfit / currentSummary.totalRevenue) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="text-sm text-gray-600">Profit Margin</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {currentSummary ? Math.round(currentSummary.transactionCount / 7) : 0}
            </div>
            <div className="text-sm text-gray-600">Daily Avg Transactions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;