import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart, Area } from 'recharts';
import { TrendingUp, Package, ShoppingCart, DollarSign, LucideIcon, Calendar, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Percent } from 'lucide-react';
import { fetchData } from './data.ts';
import type { ApiResponse } from './data.ts';
import './styles.css';

// Type Definitions
interface ColumnData {
  name: string;
  value: (string | number)[];
}

interface ProductData {
  product_id: string;
  product_name: string;
  total_items_sold: number;
}

interface MonthlyData {
  month: string;
  total_sales: number;
  gross_product_sales: number;
  orders_count: number;
  avg_order_value?: number;
  discounts_returns?: number;
  sales_growth?: number;
  orders_growth?: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  trend?: number;
  subtitle?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

// Utility Functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatPercent = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Convert columnar data to row-based objects
const columnarToRows = <T,>(columnarData: ColumnData[]): T[] => {
  if (!columnarData || columnarData.length === 0) return [];
  
  const numRows = columnarData[0].value.length;
  const rows: any[] = [];
  
  for (let i = 0; i < numRows; i++) {
    const row: any = {};
    columnarData.forEach(col => {
      row[col.name] = col.value[i];
    });
    rows.push(row);
  }
  
  return rows;
};

// Components
const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, iconColor, trend, subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center gap-4">
    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor }}>
      <Icon size={24} color="white" />
    </div>
    <div className="flex-1">
      <h3 className="text-sm text-gray-500 font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-sm font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp size={16} /> : <ChevronDown size={16} />}
          <span>{formatPercent(trend)} vs last month</span>
        </div>
      )}
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm px-4 py-3 rounded-lg text-white text-sm shadow-xl">
        <p className="font-semibold mb-2 pb-2 border-b border-white/20">{label || ''}</p>
        {payload.map((entry, index) => (
          <p key={index} className="my-1" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Sales') || entry.name.includes('sales') 
              ? formatCurrency(entry.value) 
              : formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const App: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showQueries, setShowQueries] = useState<boolean>(false);
  
  // Initialize with today's date
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
  const sixMonthsAgo = new Date(new Date().setDate(new Date().getDate() - 180)).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(sixMonthsAgo);
  const [endDate, setEndDate] = useState<string>(yesterday);
  
  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const fetchedData = await fetchData(startDate, endDate);
      setData(fetchedData);
      console.log('data from iframe', fetchedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on initial mount
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12 text-white">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Sales Analytics Dashboard</h1>
            <p className="text-lg opacity-90 font-light">Loading your business insights...</p>
          </header>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12 text-white">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Sales Analytics Dashboard</h1>
          </header>
          <div className="bg-white p-8 rounded-xl text-center text-red-500 font-medium shadow-xl">
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12 text-white">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Sales Analytics Dashboard</h1>
          </header>
          <div className="bg-white p-8 rounded-xl text-center text-red-500 font-medium shadow-xl">
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform columnar data to row-based
  const topProducts: ProductData[] = columnarToRows<ProductData>(data.data[0]);
  const rawMonthlyStats: MonthlyData[] = columnarToRows<MonthlyData>(data.data[1]);
  
  // Enhance monthly data with calculations
  const monthlyStats: MonthlyData[] = rawMonthlyStats.map((stat, index) => {
    const avgOrderValue = stat.orders_count > 0 ? stat.total_sales / stat.orders_count : 0;
    const discountsReturns = stat.gross_product_sales - stat.total_sales;
    
    // Calculate growth vs previous month (next index since data is DESC)
    const prevMonth = rawMonthlyStats[index + 1];
    const salesGrowth = prevMonth ? ((stat.total_sales - prevMonth.total_sales) / prevMonth.total_sales) * 100 : 0;
    const ordersGrowth = prevMonth ? ((stat.orders_count - prevMonth.orders_count) / prevMonth.orders_count) * 100 : 0;
    
    return {
      ...stat,
      avg_order_value: avgOrderValue,
      discounts_returns: discountsReturns,
      sales_growth: salesGrowth,
      orders_growth: ordersGrowth,
    };
  });
  
  // Calculate totals and trends
  const totalItemsSold = topProducts.reduce((sum, item) => sum + item.total_items_sold, 0);
  const totalSales = monthlyStats.reduce((sum, item) => sum + item.total_sales, 0);
  const totalOrders = monthlyStats.reduce((sum, item) => sum + item.orders_count, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalDiscountsReturns = monthlyStats.reduce((sum, item) => sum + (item.discounts_returns || 0), 0);
  
  // Calculate month-over-month trends (comparing most recent to previous month)
  const latestMonth = monthlyStats[0];
  const salesTrend = latestMonth?.sales_growth || 0;
  const ordersTrend = latestMonth?.orders_growth || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Sales Analytics Dashboard</h1>
          <p className="text-lg opacity-90 font-light">
            Product Performance & Sales Trends
          </p>
          <p className="text-sm opacity-80 mt-1">
            {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
          </p>
        </header>

        {/* Date Picker */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              <label className="text-sm font-semibold text-gray-700">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              <label className="text-sm font-semibold text-gray-700">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Update Data'}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Sales"
            value={formatCurrency(totalSales)}
            icon={DollarSign}
            iconColor="#10b981"
            trend={salesTrend}
            subtitle={`Last 6 months`}
          />
          <MetricCard
            title="Total Orders"
            value={formatNumber(totalOrders)}
            icon={ShoppingCart}
            iconColor="#3b82f6"
            trend={ordersTrend}
            subtitle={`${formatNumber(totalOrders / monthlyStats.length)} avg/month`}
          />
          <MetricCard
            title="Items Sold"
            value={formatNumber(totalItemsSold)}
            icon={Package}
            iconColor="#f59e0b"
            subtitle="Top 10 products (Last year)"
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(avgOrderValue)}
            icon={TrendingUp}
            iconColor="#8b5cf6"
            subtitle={`Discounts/Returns: ${formatCurrency(totalDiscountsReturns)}`}
          />
        </div>

        {/* Insights Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 p-6 rounded-xl mb-8 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={24} color="white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white/70 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Best Selling Product</p>
                  <p className="font-semibold text-gray-900 text-sm">{topProducts[0]?.product_name}</p>
                  <p className="text-xs text-indigo-600 font-semibold">{formatNumber(topProducts[0]?.total_items_sold)} units</p>
                </div>
                <div className="bg-white/70 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Best Month (Sales)</p>
                  <p className="font-semibold text-gray-900 text-sm">{[...monthlyStats].sort((a, b) => b.total_sales - a.total_sales)[0]?.month}</p>
                  <p className="text-xs text-green-600 font-semibold">{formatCurrency([...monthlyStats].sort((a, b) => b.total_sales - a.total_sales)[0]?.total_sales)}</p>
                </div>
                <div className="bg-white/70 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Latest AOV</p>
                  <p className="font-semibold text-gray-900 text-sm">{formatCurrency(latestMonth?.avg_order_value || 0)}</p>
                  <p className="text-xs text-purple-600 font-semibold">{latestMonth?.month}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Top 10 Products by Items Sold</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis 
                  type="category" 
                  dataKey="product_name" 
                  width={150}
                  style={{ fontSize: '10px' }}
                  tick={{ width: 150 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_items_sold" fill="#3b82f6" name="Items Sold" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Sales Trend */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Sales Trend</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={[...monthlyStats].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total_sales" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Total Sales"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gross_product_sales" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Gross Product Sales"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Orders Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Orders & AOV</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={[...monthlyStats].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="left"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value: number) => `$${value.toFixed(0)}`}
                  label={{ value: 'AOV', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="orders_count" fill="#f59e0b" name="Orders" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avg_order_value" stroke="#8b5cf6" strokeWidth={3} name="Avg Order Value" dot={{ fill: '#8b5cf6', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Discounts & Returns Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales vs Gross (Discounts/Returns)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={[...monthlyStats].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="gross_product_sales" fill="#a78bfa" stroke="#8b5cf6" fillOpacity={0.3} name="Gross Sales" />
                <Area type="monotone" dataKey="total_sales" fill="#34d399" stroke="#10b981" fillOpacity={0.5} name="Net Sales" />
                <Line type="monotone" dataKey="discounts_returns" stroke="#ef4444" strokeWidth={2} name="Discounts/Returns" dot={{ fill: '#ef4444', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Trends */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Month-over-Month Growth Rates</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={[...monthlyStats].reverse().slice(1)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value: number) => formatPercent(value)}
                labelFormatter={(label: string) => `Growth in ${label}`}
              />
              <Legend />
              <Bar dataKey="sales_growth" fill="#10b981" name="Sales Growth %" radius={[8, 8, 0, 0]} />
              <Bar dataKey="orders_growth" fill="#3b82f6" name="Orders Growth %" radius={[8, 8, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Products Table */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Products Detail</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items Sold</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item: ProductData, index: number) => {
                  const itemPercent: number = (item.total_items_sold / totalItemsSold) * 100;
                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-bold text-gray-500">#{index + 1}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 font-mono">{item.product_id}</td>
                      <td className="px-4 py-4 text-sm font-bold text-indigo-600">{formatNumber(item.total_items_sold)}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300" 
                              style={{ width: `${itemPercent}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-600 min-w-[45px]">{itemPercent.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Statistics Table */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Performance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Month</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Sales</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Gross Sales</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Discounts</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">AOV</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Sales Growth</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((stat: MonthlyData, index: number) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-semibold text-indigo-600">{stat.month}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900">{formatCurrency(stat.total_sales)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatCurrency(stat.gross_product_sales)}</td>
                    <td className="px-3 py-3 text-right text-red-600 font-medium">{formatCurrency(stat.discounts_returns || 0)}</td>
                    <td className="px-3 py-3 text-right text-gray-900">{formatNumber(stat.orders_count)}</td>
                    <td className="px-3 py-3 text-right text-purple-600 font-medium">{formatCurrency(stat.avg_order_value || 0)}</td>
                    <td className="px-3 py-3 text-right">
                        <span className={`font-semibold ${stat.sales_growth || 0 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.sales_growth ? formatPercent(stat.sales_growth) : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td className="px-3 py-3">Total</td>
                  <td className="px-3 py-3 text-right text-green-700">{formatCurrency(totalSales)}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(monthlyStats.reduce((sum, s) => sum + s.gross_product_sales, 0))}</td>
                  <td className="px-3 py-3 text-right text-red-700">{formatCurrency(totalDiscountsReturns)}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{formatNumber(totalOrders)}</td>
                  <td className="px-3 py-3 text-right text-purple-700">{formatCurrency(avgOrderValue)}</td>
                  <td className="px-3 py-3 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SQL Queries Section */}
        {data.queries && data.queries.length > 0 && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowQueries(!showQueries)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Percent size={20} color="white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">SQL Queries Executed</h3>
                  <p className="text-sm text-gray-500">View the {data.queries.length} queries used to generate this dashboard</p>
                </div>
              </div>
              {showQueries ? <ChevronUp size={24} className="text-gray-600" /> : <ChevronDown size={24} className="text-gray-600" />}
            </button>
            
            {showQueries && (
              <div className="px-6 py-4 bg-white border-t-2 border-gray-200">
                {data.queries.map((query: string, index: number) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                        Query {index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {index === 0 ? 'Top Products' : index === 1 ? 'Monthly Stats' : `Dataset ${index + 1}`}
                      </span>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap break-words">
                      {query}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);
root.render(<App />);

export default App;