'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Users, ShoppingCart, Package, TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ValueBlock from '@/components/ui/ValueBlock';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer: {
    fullname: string;
    email: string;
  };
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueChange: 0,
    ordersChange: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalRevenue: 25450000,
        totalOrders: 342,
        totalUsers: 1245,
        totalProducts: 896,
        revenueChange: 12.5,
        ordersChange: -3.2,
      });

      // Mock recent orders
      setRecentOrders([
        {
          id: 1,
          order_number: 'ORD-2024-001',
          customer: { fullname: 'Nguyễn Văn A', email: 'nguyenvana@example.com' },
          total_amount: 1250000,
          status: 'delivered',
          payment_status: 'paid',
          created_at: '2024-02-01',
        },
        {
          id: 2,
          order_number: 'ORD-2024-002',
          customer: { fullname: 'Trần Thị B', email: 'tranthib@example.com' },
          total_amount: 890000,
          status: 'pending',
          payment_status: 'unpaid',
          created_at: '2024-02-01',
        },
        {
          id: 3,
          order_number: 'ORD-2024-003',
          customer: { fullname: 'Lê Văn C', email: 'levanc@example.com' },
          total_amount: 2100000,
          status: 'processing',
          payment_status: 'paid',
          created_at: '2024-01-31',
        },
        {
          id: 4,
          order_number: 'ORD-2024-004',
          customer: { fullname: 'Phạm Thị D', email: 'phamthid@example.com' },
          total_amount: 650000,
          status: 'shipped',
          payment_status: 'paid',
          created_at: '2024-01-31',
        },
        {
          id: 5,
          order_number: 'ORD-2024-005',
          customer: { fullname: 'Hoàng Văn E', email: 'hoangvane@example.com' },
          total_amount: 1800000,
          status: 'cancelled',
          payment_status: 'refunded',
          created_at: '2024-01-30',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#FAFAF9]">Loading dashboard...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
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

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen text-[#FAFAF9]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-[#A1A1AA]">Welcome back, {''}! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A1A1AA]">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
              <div className="flex items-center mt-2">
                {stats.revenueChange >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">+{stats.revenueChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-500">{stats.revenueChange}%</span>
                  </>
                )}
                <span className="text-sm text-[#A1A1AA]"> from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A1A1AA]">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
              <div className="flex items-center mt-2">
                {stats.ordersChange >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">+{Math.abs(stats.ordersChange)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-500">{Math.abs(stats.ordersChange)}%</span>
                  </>
                )}
                <span className="text-sm text-[#A1A1AA]"> from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A1A1AA]">Total Customers</p>
              <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+8.2%</span>
                <span className="text-sm text-[#A1A1AA]"> from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A1A1AA]">Total Products</p>
              <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-[#A1A1AA]">Active products</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent Orders */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent Orders</h2>
              <p className="text-sm text-[#A1A1AA]">Latest orders from customers</p>
            </div>
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors"
            >
              View All
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Order</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4">{order.order_number}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{order.customer.fullname}</p>
                      <p className="text-sm text-[#A1A1AA]">{order.customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#A1A1AA]">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[#7366ff] hover:text-[#5d54cc] font-medium"
                    >
                      View
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