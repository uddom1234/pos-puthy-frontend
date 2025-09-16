import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, categoriesAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FunnelIcon, ChartBarIcon, DocumentTextIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import ExportDropdown from '../common/ExportDropdown';
import { exportData } from '../../utils/exportHandlers';
import { CardSkeleton, TableSkeleton, ChartSkeleton, FilterSkeleton } from '../common/SkeletonLoader';

interface SalesSummary {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  transactionCount: number;
  paidTransactionCount: number;
  unpaidTransactionCount: number;
  orderCount: number;
  orderTotal: number;
  totalItemsSold: number;
  averageOrderValue: number;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  itemsSold: Array<{
    productName: string;
    productId: string | null;
    category: string;
    quantity: number;
    revenue: number;
    avgPrice: number;
    orderCount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    quantity: number;
    revenue: number;
    uniqueProducts: number;
  }>;
  hourlyData: Array<{
    hour: number;
    transactionCount: number;
    revenue: number;
    itemsSold: number;
  }>;
}

interface TopSellingItem {
  productName: string;
  productId: string | null;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  avgPrice: number;
  orderCount: number;
}

interface IncomeExpenseTrend {
  period: string;
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
}

interface OrderReport {
  id: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productName: string;
    productId: string | null;
    category: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  cashReceived: number;
  changeAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  paidOrderCount: number;
  lowStockCount: number;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    category: string;
    stock_quantity: number;
    min_stock_level: number;
  }>;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
}

const Reports: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'summary' | 'top-selling' | 'trends' | 'orders'>('summary');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    period: 'daily' as 'daily' | 'monthly',
    startDate: '',
    endDate: '',
    category: '',
    groupBy: 'day' as 'hour' | 'day' | 'week' | 'month',
    limit: 50,
    page: 1,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // Report data states
  const [summaryData, setSummaryData] = useState<SalesSummary | null>(null);
  const [topSellingData, setTopSellingData] = useState<{ items: TopSellingItem[] } | null>(null);
  const [trendsData, setTrendsData] = useState<{ trends: IncomeExpenseTrend[] } | null>(null);
  const [ordersData, setOrdersData] = useState<{ orders: OrderReport[], pagination: any } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchCategories = async () => {
    try {
      const categoryData = await categoriesAPI.list();
      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSummaryData = useCallback(async () => {
    try {
      const params: any = {};
      if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      } else {
        params.period = filters.period;
      }
      if (filters.category) {
        params.category = filters.category;
      }
      const data = await reportsAPI.getSalesSummary(params);
      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching summary data:', error);
    }
  }, [filters.startDate, filters.endDate, filters.period, filters.category]);

  const fetchTopSellingData = useCallback(async () => {
    try {
      const params: any = { limit: filters.limit };
      if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      } else {
        params.period = filters.period;
      }
      const data = await reportsAPI.getTopSellingItems(params);
      setTopSellingData(data);
    } catch (error) {
      console.error('Error fetching top selling data:', error);
    }
  }, [filters.startDate, filters.endDate, filters.period, filters.limit]);

  const fetchTrendsData = useCallback(async () => {
    try {
      const params: any = { groupBy: filters.groupBy };
      if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      } else {
        params.period = filters.period;
      }
      const data = await reportsAPI.getIncomeExpenseTrends(params);
      setTrendsData(data);
    } catch (error) {
      console.error('Error fetching trends data:', error);
    }
  }, [filters.startDate, filters.endDate, filters.period, filters.groupBy]);

  const fetchOrdersData = useCallback(async () => {
    try {
      const params: any = { 
        page: filters.page, 
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      } else {
        params.period = filters.period;
      }
      const data = await reportsAPI.getOrders(params);
      setOrdersData(data);
    } catch (error) {
      console.error('Error fetching orders data:', error);
    }
  }, [filters.startDate, filters.endDate, filters.period, filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const params = { period: filters.period };
      const data = await reportsAPI.getDashboard(params);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [filters.period]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummaryData(),
        fetchTopSellingData(),
        fetchTrendsData(),
        fetchOrdersData(),
        fetchDashboardData()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchSummaryData, fetchTopSellingData, fetchTrendsData, fetchOrdersData, fetchDashboardData]);

  useEffect(() => {
    fetchCategories();
    fetchAllData();
  }, [fetchAllData]);

  const handleExport = (format: string) => {
    const currentData = getCurrentReportData();
    if (!currentData) return;

    const filename = `report-${activeTab}-${filters.period || 'custom'}-${new Date().toISOString().split('T')[0]}`;
    exportData(format, currentData, filename);
  };

  const getCurrentReportData = () => {
    switch (activeTab) {
      case 'summary':
        return summaryData;
      case 'top-selling':
        return topSellingData;
      case 'trends':
        return trendsData;
      case 'orders':
        return ordersData;
      default:
        return null;
    }
  };

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="h-8 w-64 skeleton-shimmer rounded"></div>
          <div className="h-10 w-32 skeleton-shimmer rounded-lg"></div>
        </div>
        
        <div className="card p-6">
          <div className="h-6 w-24 skeleton-shimmer rounded mb-4"></div>
          <FilterSkeleton count={5} />
        </div>
        
        <CardSkeleton count={4} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('reports')}</h1>
        <div className="flex items-center space-x-4">
          <ExportDropdown
            onExport={handleExport}
            data={getCurrentReportData() || {}}
            filename={`report-${activeTab}-${filters.period || 'custom'}-${new Date().toISOString().split('T')[0]}`}
            disabled={!getCurrentReportData()}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'summary', name: 'Summary', icon: ChartBarIcon },
              { id: 'top-selling', name: 'Top Selling Items', icon: ShoppingBagIcon },
              { id: 'trends', name: 'Income/Expense Trends', icon: ChartBarIcon },
              { id: 'orders', name: 'Orders Report', icon: DocumentTextIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('filter')}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('period')}</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
              className="input-field"
            >
              <option value="daily">{t('daily')}</option>
              <option value="monthly">{t('monthly')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('start_date')}</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('end_date')}</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              <option value="">{t('all_categories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {activeTab === 'trends' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value as any }))}
                className="input-field"
              >
                <option value="hour">Hour</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          )}

          {activeTab === 'top-selling' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limit</label>
              <input
                type="number"
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 50 }))}
                className="input-field"
                min="1"
                max="200"
              />
            </div>
          )}
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ 
                period: 'daily', 
                startDate: '', 
                endDate: '', 
                category: '',
                groupBy: 'day',
                limit: 50,
                page: 1,
                sortBy: 'created_at',
                sortOrder: 'desc'
              })}
              className="btn-outline w-full"
            >
              {t('reset')}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'summary' && summaryData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('total_revenue')}</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">${summaryData.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('total_expenses_label')}</h3>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">-${summaryData.totalExpenses.toFixed(2)}</p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('net_profit')}</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">${summaryData.netProfit.toFixed(2)}</p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('orders')}</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{summaryData.orderCount}</p>
              </div>
            </div>

            {/* Summary Tables */}
            <div className="space-y-6">
              {/* Period Summary Table */}
              <div className="card p-0 overflow-hidden">
                <div className="bg-gray-800 text-white px-6 py-4">
                  <h3 className="text-lg font-semibold">{t('summary')}</h3>
                  <p className="text-sm text-gray-300">{t('period')}: {summaryData.period || (filters.period || 'custom')}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300">{t('metric')}</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">{t('value')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{t('total_revenue')}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">${summaryData.totalRevenue.toFixed(2)}</td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{t('total_expenses_label')}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">-${summaryData.totalExpenses.toFixed(2)}</td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{t('net_profit')}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-green-600 dark:text-green-400">${summaryData.netProfit.toFixed(2)}</td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{t('orders')}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{summaryData.orderCount} (${summaryData.orderTotal.toFixed(2)})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Income by Category */}
              <div className="card p-0 overflow-hidden">
                <div className="bg-gray-800 text-white px-6 py-4">
                  <h3 className="text-lg font-semibold">{t('income_by_category')}</h3>
                  <p className="text-sm text-gray-300">{t('summed_by_category')}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300">{t('category')}</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {Object.entries(summaryData.incomeByCategory || {}).map(([cat, amount]) => (
                        <tr key={cat} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{cat}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">${Number(amount).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-200 dark:bg-gray-700 border-t-2 border-gray-400 dark:border-gray-500 font-bold">
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{t('total')}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">${Object.values(summaryData.incomeByCategory || {}).reduce((s, v) => s + Number(v), 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense by Category */}
              <div className="card p-0 overflow-hidden">
                <div className="bg-gray-800 text-white px-6 py-4">
                  <h3 className="text-lg font-semibold">{t('expenses_by_category')}</h3>
                  <p className="text-sm text-gray-300">{t('summed_by_category')}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300">{t('category')}</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {Object.entries(summaryData.expenseByCategory || {}).map(([cat, amount]) => (
                        <tr key={cat} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{cat}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">-${Number(amount).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-200 dark:bg-gray-700 border-t-2 border-gray-400 dark:border-gray-500 font-bold">
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{t('total')}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">-${Object.values(summaryData.expenseByCategory || {}).reduce((s, v) => s + Number(v), 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'top-selling' && topSellingData && (
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-800 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">Top Selling Items</h3>
              <p className="text-sm text-gray-300">Best performing products by quantity sold</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Product Name</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Category</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Quantity Sold</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Revenue</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Avg Price</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Orders</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800">
                  {topSellingData.items.map((item, index) => (
                    <tr key={item.productId || index} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 font-mono">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                        {item.totalQuantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                        ${item.totalRevenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                        ${item.avgPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right font-mono">
                        {item.orderCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'trends' && trendsData && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Income vs Expense Trends</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={(period) => {
                        if (filters.groupBy === 'hour') return period.split(' ')[1]?.substring(0, 5) || period;
                        if (filters.groupBy === 'day') return period.split(' ')[0]?.split('-').slice(1).join('/') || period;
                        return period;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${Number(value).toFixed(2)}`,
                        name === 'income' ? 'Income' : 'Expense'
                      ]}
                    />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="expense" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-semibold">Trends Data</h3>
                <p className="text-sm text-gray-300">Detailed breakdown by {filters.groupBy}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Period</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Income</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Expense</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Net</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    {trendsData.trends.map((trend, index) => (
                      <tr key={trend.period} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 font-mono">
                          {trend.period}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                          ${trend.income.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                          -${trend.expense.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                          ${(trend.income - trend.expense).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right font-mono">
                          {trend.incomeCount + trend.expenseCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && ordersData && (
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-800 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">Orders Report</h3>
              <p className="text-sm text-gray-300">
                Showing {ordersData.orders.length} of {ordersData.pagination.total} orders
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Order #</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Customer</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Total</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800">
                  {ordersData.orders.map((order, index) => (
                    <tr key={order.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 font-mono">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        <div>
                          <div className="font-medium">{order.customerName || 'Walk-in'}</div>
                          {order.customerPhone && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{order.customerPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!getCurrentReportData() && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('no_data_for_filters')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;