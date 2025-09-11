import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, categoriesAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FunnelIcon } from '@heroicons/react/24/outline';
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

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    period: 'daily' as 'daily' | 'monthly',
    startDate: '',
    endDate: '',
    category: '',
  });

  const fetchCategories = async () => {
    try {
      const categoryData = await categoriesAPI.list();
      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
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
      setReportData(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.period, filters.category]);

  useEffect(() => {
    fetchCategories();
    fetchReports();
  }, [fetchReports]);

  const handleExport = (format: string) => {
    if (!reportData) return;

    const reportExportData = {
      period: reportData.period,
      summary: {
        totalRevenue: reportData.totalRevenue,
        totalExpenses: reportData.totalExpenses,
        netProfit: reportData.netProfit,
        transactionCount: reportData.transactionCount,
        totalItemsSold: reportData.totalItemsSold,
        averageOrderValue: reportData.averageOrderValue,
      },
      itemsSold: reportData.itemsSold,
      categoryBreakdown: reportData.categoryBreakdown,
      hourlyData: reportData.hourlyData,
      generatedAt: new Date().toISOString(),
    };

    const filename = `sales-report-${filters.period || 'custom'}-${new Date().toISOString().split('T')[0]}`;
    exportData(format, reportExportData, filename);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Sales Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <ExportDropdown
            onExport={handleExport}
            data={reportData || {}}
            filename={`sales-report-${filters.period || 'custom'}-${new Date().toISOString().split('T')[0]}`}
            disabled={!reportData}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ period: 'daily', startDate: '', endDate: '', category: '' })}
              className="btn-outline w-full"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Total Revenue</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${reportData.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{reportData.transactionCount} transactions</p>
          </div>
          
          <div className="card p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">Items Sold</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{reportData.totalItemsSold}</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Across all products</p>
          </div>
          
          <div className="card p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">Avg Order Value</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">${reportData.averageOrderValue.toFixed(2)}</p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Per transaction</p>
          </div>
          
          <div className="card p-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">Net Profit</h3>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">${reportData.netProfit.toFixed(2)}</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Margin: {reportData.totalRevenue > 0 ? ((reportData.netProfit / reportData.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Selling Items</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {reportData.itemsSold.slice(0, 10).map((item, index) => (
                <div key={item.productId || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.category} • Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">${item.revenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">${item.avgPrice.toFixed(2)} avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Sales by Category</h3>
            {reportData.categoryBreakdown.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="revenue"
                      label={({ category, revenue }) => `${category}: $${revenue.toFixed(0)}`}
                    >
                      {reportData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </div>

          {/* Hourly Sales Pattern */}
          {reportData.hourlyData.length > 0 && (
            <div className="card p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Hourly Sales Pattern</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(hour) => `Hour: ${hour}:00`}
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${Number(value).toFixed(2)}` : value,
                        name === 'revenue' ? 'Revenue' : name === 'itemsSold' ? 'Items Sold' : 'Transactions'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#8B5CF6" name="revenue" />
                    <Bar dataKey="itemsSold" fill="#06B6D4" name="itemsSold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Excel-like Data Tables */}
      {reportData && (
        <div className="space-y-6">
          {/* Category Performance Table */}
          {reportData.categoryBreakdown.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-semibold">Category Performance Report</h3>
                <p className="text-sm text-gray-300">Sales breakdown by product category</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Category</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Items Sold</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Revenue</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">Unique Products</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Avg Revenue/Item</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    {reportData.categoryBreakdown.map((category, index) => (
                      <tr key={category.category} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                          {category.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                          {category.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                          ${category.revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                          {category.uniqueProducts}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right font-mono">
                          ${category.quantity > 0 ? (category.revenue / category.quantity).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-gray-200 dark:bg-gray-700 border-t-2 border-gray-400 dark:border-gray-500 font-bold">
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">TOTAL</td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">All Categories</td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right border-r border-gray-300 dark:border-gray-600 font-mono">
                        {reportData.categoryBreakdown.reduce((sum, cat) => sum + cat.quantity, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right border-r border-gray-300 dark:border-gray-600 font-mono">
                        ${reportData.categoryBreakdown.reduce((sum, cat) => sum + cat.revenue, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right border-r border-gray-300 dark:border-gray-600 font-mono">
                        {reportData.categoryBreakdown.reduce((sum, cat) => sum + cat.uniqueProducts, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-right font-mono">
                        ${reportData.categoryBreakdown.reduce((sum, cat) => sum + cat.quantity, 0) > 0 ? 
                          (reportData.categoryBreakdown.reduce((sum, cat) => sum + cat.revenue, 0) / 
                           reportData.categoryBreakdown.reduce((sum, cat) => sum + cat.quantity, 0)).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Selling Items Table */}
          {reportData.itemsSold.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-semibold">Top Selling Items Report</h3>
                <p className="text-sm text-gray-300">Best performing products by revenue and quantity</p>
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
                    {reportData.itemsSold.slice(0, 20).map((item, index) => (
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
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right border-r border-gray-200 dark:border-gray-600 font-mono">
                          ${item.revenue.toFixed(2)}
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
        </div>
      )}

      {!reportData && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No data available for the selected filters</p>
        </div>
      )}
    </div>
  );
};

export default Reports;