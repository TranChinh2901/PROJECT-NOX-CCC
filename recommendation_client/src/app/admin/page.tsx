'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Users, ShoppingCart, Package } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/admin/StatCard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, type PieLabelRenderProps, type TooltipContentProps } from 'recharts';
import { adminApi, type DashboardStats, type AnalyticsData, type AdminOrder } from '@/lib/api/admin.api';

const COLORS = [
  'rgb(var(--admin-chart-primary))',
  'rgb(var(--admin-chart-secondary))',
  'rgb(var(--admin-chart-tertiary))',
  'rgb(var(--admin-chart-quaternary))',
  'rgb(var(--admin-chart-quinary))',
  'rgb(var(--admin-chart-senary))',
];

type OrderStatusDatum = AnalyticsData['orderStatusDistribution'][number];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueChange: 0,
    ordersChange: 0,
    usersChange: 0,
    productsChange: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [statsData, analyticsData, ordersData] = await Promise.all([
        adminApi.getDashboardStats().catch(() => generateMockStats()),
        adminApi.getAnalyticsData({ period: 'month' }).catch(() => generateMockAnalytics()),
        adminApi.getAllOrders({ limit: 5, sort: '-created_at' }).catch(() => ({ data: generateMockOrders(), total: 5, page: 1, limit: 5, totalPages: 1 })),
      ]);

      setStats(statsData);
      setAnalytics(analyticsData);
      setRecentOrders(ordersData.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use mock data as fallback
      setStats(generateMockStats());
      setAnalytics(generateMockAnalytics());
      setRecentOrders(generateMockOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const generateMockStats = (): DashboardStats => ({
    totalRevenue: 25450000,
    totalOrders: 342,
    totalUsers: 1245,
    totalProducts: 896,
    revenueChange: 12.5,
    ordersChange: -3.2,
    usersChange: 8.2,
    productsChange: 5.1,
  });

  const generateMockAnalytics = (): AnalyticsData => ({
    revenueByDay: [
      { date: '2026-01-28', revenue: 1200000, orders: 12 },
      { date: '2026-01-29', revenue: 1850000, orders: 18 },
      { date: '2026-01-30', revenue: 2100000, orders: 21 },
      { date: '2026-01-31', revenue: 1650000, orders: 16 },
      { date: '2026-02-01', revenue: 2400000, orders: 24 },
      { date: '2026-02-02', revenue: 2200000, orders: 22 },
      { date: '2026-02-03', revenue: 2650000, orders: 27 },
    ],
    topProducts: [
      { id: 1, name: 'iPhone 15 Pro Max', sales: 45, revenue: 1350000000, image_url: '/products/iphone.jpg' },
      { id: 2, name: 'MacBook Pro M3', sales: 32, revenue: 960000000, image_url: '/products/macbook.jpg' },
      { id: 3, name: 'AirPods Pro', sales: 78, revenue: 234000000, image_url: '/products/airpods.jpg' },
      { id: 4, name: 'iPad Air', sales: 28, revenue: 420000000, image_url: '/products/ipad.jpg' },
      { id: 5, name: 'Apple Watch Series 9', sales: 41, revenue: 369000000, image_url: '/products/watch.jpg' },
    ],
    userGrowth: [
      { date: '2026-01-28', users: 1180, active_users: 850 },
      { date: '2026-01-29', users: 1195, active_users: 865 },
      { date: '2026-01-30', users: 1210, active_users: 880 },
      { date: '2026-01-31', users: 1225, active_users: 895 },
      { date: '2026-02-01', users: 1230, active_users: 905 },
      { date: '2026-02-02', users: 1240, active_users: 915 },
      { date: '2026-02-03', users: 1245, active_users: 925 },
    ],
    orderStatusDistribution: [
      { status: 'Delivered', count: 145, percentage: 42.4 },
      { status: 'Processing', count: 89, percentage: 26.0 },
      { status: 'Shipped', count: 62, percentage: 18.1 },
      { status: 'Pending', count: 31, percentage: 9.1 },
      { status: 'Cancelled', count: 15, percentage: 4.4 },
    ],
  });

  const generateMockOrders = (): AdminOrder[] => [
    {
      id: 1,
      order_number: 'ORD-2024-001',
      customer: { id: 1, fullname: 'Nguyễn Văn A', email: 'nguyenvana@example.com' },
      total_amount: 1250000,
      status: 'delivered',
      payment_status: 'paid',
      created_at: '2024-02-01',
      updated_at: '2024-02-01',
      items_count: 3,
    },
    {
      id: 2,
      order_number: 'ORD-2024-002',
      customer: { id: 2, fullname: 'Trần Thị B', email: 'tranthib@example.com' },
      total_amount: 890000,
      status: 'pending',
      payment_status: 'unpaid',
      created_at: '2024-02-01',
      updated_at: '2024-02-01',
      items_count: 2,
    },
    {
      id: 3,
      order_number: 'ORD-2024-003',
      customer: { id: 3, fullname: 'Lê Văn C', email: 'levanc@example.com' },
      total_amount: 2100000,
      status: 'processing',
      payment_status: 'paid',
      created_at: '2024-01-31',
      updated_at: '2024-01-31',
      items_count: 5,
    },
    {
      id: 4,
      order_number: 'ORD-2024-004',
      customer: { id: 4, fullname: 'Phạm Thị D', email: 'phamthid@example.com' },
      total_amount: 650000,
      status: 'shipped',
      payment_status: 'paid',
      created_at: '2024-01-31',
      updated_at: '2024-01-31',
      items_count: 1,
    },
    {
      id: 5,
      order_number: 'ORD-2024-005',
      customer: { id: 5, fullname: 'Hoàng Văn E', email: 'hoangvane@example.com' },
      total_amount: 1800000,
      status: 'cancelled',
      payment_status: 'refunded',
      created_at: '2024-01-30',
      updated_at: '2024-01-30',
      items_count: 4,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Đang tải bảng điều khiển...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đã giao vận',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      paid: 'Đã thanh toán',
      unpaid: 'Chưa thanh toán',
      refunded: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipContentProps<number | string | ReadonlyArray<number | string>, string | number>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[rgb(var(--admin-border))] rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-[rgb(var(--admin-text))] mb-1">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm text-[rgb(var(--admin-text-muted))]">
              {entry.name}: <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOrderStatusLabel = ({
    payload,
  }: PieLabelRenderProps & { payload?: OrderStatusDatum }) => {
    if (!payload) {
      return '';
    }

    return `${payload.status}: ${payload.percentage}%`;
  };

  return (
    <div className="min-h-screen text-[rgb(var(--admin-text))]">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-[rgb(var(--admin-text))]">Bảng điều khiển</h1>
        <p className="text-[rgb(var(--admin-text-muted))] text-base">Chào mừng trở lại! Đây là những gì đang diễn ra hôm nay.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-10">
        <StatCard
          title="Tổng doanh thu"
          subtitle="30 ngày qua"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          sparklineData={analytics?.revenueByDay?.map(d => d.revenue) || []}
          icon={<DollarSign className="w-6 h-6" />}
          iconColor="text-[rgb(var(--admin-success))]"
          loading={loading}
        />

        <StatCard
          title="Tổng đơn hàng"
          subtitle="30 ngày qua"
          value={stats.totalOrders}
          change={stats.ordersChange}
          sparklineData={analytics?.revenueByDay?.map(d => d.orders) || []}
          icon={<ShoppingCart className="w-6 h-6" />}
          iconColor="text-[rgb(var(--admin-primary))]"
          loading={loading}
        />

        <StatCard
          title="Tổng khách hàng"
          subtitle="Người dùng hoạt động"
          value={stats.totalUsers}
          change={stats.usersChange}
          sparklineData={analytics?.userGrowth?.map(d => d.users) || []}
          icon={<Users className="w-6 h-6" />}
          iconColor="text-[rgb(var(--admin-chart-quaternary))]"
          loading={loading}
        />

        <StatCard
          title="Tổng sản phẩm"
          subtitle="Trong danh mục"
          value={stats.totalProducts}
          change={stats.productsChange}
          icon={<Package className="w-6 h-6" />}
          iconColor="text-[rgb(var(--admin-accent))]"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      {analytics && (
        <>
          {/* Revenue and Orders Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 mb-10">
            <GlassCard className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-[rgb(var(--admin-text))] tracking-tight">Xu hướng doanh thu</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.revenueByDay}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--admin-chart-primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(var(--admin-chart-primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226, 232, 240)" />
                  <XAxis dataKey="date" tickFormatter={formatDateShort} stroke="rgb(100, 116, 139)" fontSize={12} />
                  <YAxis tickFormatter={formatCurrencyShort} stroke="rgb(100, 116, 139)" fontSize={12} />
                  <Tooltip content={CustomTooltip} />
                  <Area type="monotone" dataKey="revenue" stroke="rgb(var(--admin-chart-primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-[rgb(var(--admin-text))] tracking-tight">Tổng quan đơn hàng</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226, 232, 240)" />
                  <XAxis dataKey="date" tickFormatter={formatDateShort} stroke="rgb(100, 116, 139)" fontSize={12} />
                  <YAxis stroke="rgb(100, 116, 139)" fontSize={12} />
                  <Tooltip content={CustomTooltip} />
                  <Bar dataKey="orders" fill="rgb(var(--admin-chart-primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* Top Products and Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 mb-10">
            <GlassCard className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-[rgb(var(--admin-text))] tracking-tight">Sản phẩm bán chạy</h2>
              <div className="space-y-4">
                {analytics.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgb(var(--admin-background))] transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-[rgb(var(--admin-primary))]/15 to-[rgb(var(--admin-primary))]/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[rgb(var(--admin-primary))]">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[rgb(var(--admin-text))]">{product.name}</p>
                        <p className="text-sm text-[rgb(var(--admin-text-muted))]">{product.sales} lượt bán</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[rgb(var(--admin-text))]">{formatCurrencyShort(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-[rgb(var(--admin-text))] tracking-tight">Phân bổ trạng thái đơn hàng</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.orderStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderOrderStatusLabel}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {analytics.orderStatusDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* User Growth */}
          <div className="mb-10">
            <GlassCard className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-[rgb(var(--admin-text))] tracking-tight">Tăng trưởng người dùng</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226, 232, 240)" />
                  <XAxis dataKey="date" tickFormatter={formatDateShort} stroke="rgb(100, 116, 139)" fontSize={12} />
                  <YAxis stroke="rgb(100, 116, 139)" fontSize={12} />
                  <Tooltip content={CustomTooltip} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="users" stroke="rgb(var(--admin-chart-primary))" strokeWidth={3} name="Tổng người dùng" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="active_users" stroke="rgb(var(--admin-chart-quaternary))" strokeWidth={3} name="Người dùng hoạt động" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
        </>
      )}

      {/* Recent Orders */}
      <div className="glass-card backdrop-blur-sm bg-white border border-[rgb(var(--admin-border))] rounded-xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
        <div className="p-6 border-b border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-background))]/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[rgb(var(--admin-text))] tracking-tight">Đơn hàng gần đây</h2>
              <p className="text-sm text-[rgb(var(--admin-text-muted))] mt-1">Đơn hàng mới nhất từ khách hàng</p>
            </div>
            <Link
              href="/admin/orders"
              className="px-5 py-2.5 bg-[rgb(var(--admin-primary))] text-white rounded-lg hover:bg-[rgb(var(--admin-primary-hover))] transition-colors duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
            >
              Xem tất cả
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-background))]/30">
                <th className="px-6 py-4 text-left text-xs font-bold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider">Đơn hàng</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider">Ngày</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider">Số tiền</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider">Thanh toán</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-[rgb(var(--admin-border))]/50 hover:bg-[rgb(var(--admin-background))]/50 transition-colors duration-150">
                  <td className="px-6 py-4 font-mono text-sm text-[rgb(var(--admin-text))]">{order.order_number}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[rgb(var(--admin-text))]">{order.customer?.fullname ?? 'Unknown customer'}</p>
                      <p className="text-sm text-[rgb(var(--admin-text-muted))]">{order.customer?.email ?? 'No email available'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[rgb(var(--admin-text-muted))]">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4 font-bold text-[rgb(var(--admin-text))]">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusColor(order.payment_status)}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[rgb(var(--admin-primary))] hover:text-[rgb(var(--admin-primary-hover))] font-semibold text-sm hover:underline transition-all duration-200"
                    >
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
