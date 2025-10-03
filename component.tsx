import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign, LucideIcon, Calendar, RefreshCw } from 'lucide-react';
import { fetchData } from './data.ts';
import './styles.css';

// Type Definitions
interface ChannelData {
  channel: string;
  total_spend: number;
  total_revenue: number;
  roas: number;
}

interface ApiResponse {
  data: ChannelData[][];
  messages: ChannelData[][];
  hasStructuredData: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
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
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatChannelName = (channel: string): string => {
  return channel
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Components
const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, iconColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center gap-4">
    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor }}>
      <Icon size={24} color="white" />
    </div>
    <div className="flex-1">
      <h3 className="text-sm text-gray-500 font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm px-4 py-3 rounded-lg text-white text-sm shadow-xl">
        <p className="font-semibold mb-2 pb-2 border-b border-white/20">{formatChannelName(label || '')}</p>
        {payload.map((entry, index) => (
          <p key={index} className="my-1" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Revenue') || entry.name.includes('Spend') 
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
  
  // Initialize with today's date
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12 text-white">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Channel Performance Dashboard</h1>
            <p className="text-lg opacity-90 font-light">Loading your marketing analytics...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12 text-white">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Channel Performance Dashboard</h1>
          </header>
          <div className="bg-white p-8 rounded-xl text-center text-red-500 font-medium shadow-xl">
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.data || !data.data[0]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12 text-white">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Channel Performance Dashboard</h1>
          </header>
          <div className="bg-white p-8 rounded-xl text-center text-red-500 font-medium shadow-xl">
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const channelData: ChannelData[] = data.data[0];
  
  // Calculate totals
  const totalSpend: number = channelData.reduce((sum: number, item: ChannelData) => sum + item.total_spend, 0);
  const totalRevenue: number = channelData.reduce((sum: number, item: ChannelData) => sum + item.total_revenue, 0);
  const overallROAS: number = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalChannels: number = channelData.length;

  // Sort data by revenue for charts
  const sortedByRevenue: ChannelData[] = [...channelData].sort((a, b) => b.total_revenue - a.total_revenue);
  const topChannels: ChannelData[] = sortedByRevenue.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Channel Performance Dashboard</h1>
          <p className="text-lg opacity-90 font-light">
            Triple Attribution Model - Lifetime Window
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
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            iconColor="#10b981"
          />
          <MetricCard
            title="Total Spend"
            value={formatCurrency(totalSpend)}
            icon={ShoppingCart}
            iconColor="#3b82f6"
          />
          <MetricCard
            title="Overall ROAS"
            value={formatNumber(overallROAS) + 'x'}
            icon={TrendingUp}
            iconColor="#8b5cf6"
          />
          <MetricCard
            title="Active Channels"
            value={totalChannels}
            icon={Users}
            iconColor="#f59e0b"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Channel */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue by Channel</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topChannels}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="channel" 
                  tickFormatter={formatChannelName}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '12px' }}
                />
              <YAxis 
                tickFormatter={(value: number) => `$${value.toLocaleString()}`}
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_revenue" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ROAS Comparison */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">ROAS by Channel</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData.filter((c: ChannelData) => c.total_spend > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="channel" 
                  tickFormatter={formatChannelName}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '12px' }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="roas" fill="#8b5cf6" name="ROAS" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Channel Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spend</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ROAS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue %</th>
                </tr>
              </thead>
              <tbody>
                {sortedByRevenue.map((item: ChannelData, index: number) => {
                  const revenuePercent: number = (item.total_revenue / totalRevenue) * 100;
                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-semibold text-indigo-600">{formatChannelName(item.channel)}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{formatCurrency(item.total_spend)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-600">{formatCurrency(item.total_revenue)}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-block px-3 py-1.5 rounded-md font-semibold text-sm ${
                          item.roas > 5 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : item.roas > 2 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {formatNumber(item.roas)}x
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300" 
                              style={{ width: `${revenuePercent}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-600 min-w-[45px]">{revenuePercent.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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