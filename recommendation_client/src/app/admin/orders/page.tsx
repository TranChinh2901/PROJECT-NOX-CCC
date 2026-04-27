'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Download, Eye, Edit, Package, Clock, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { adminApi, type AdminOrder } from '@/lib/api/admin.api';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | '';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | '';

const orderStatusLabels: Record<Exclude<OrderStatus, ''>, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đã giao vận',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

const validStatusTransitions: Record<Exclude<OrderStatus, ''>, Array<Exclude<OrderStatus, ''>>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [showFilters, setShowFilters] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const generateMockOrders = useCallback((): AdminOrder[] => {
    const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const paymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1 + (currentPage - 1) * 10,
      order_number: `ORD-2026-${String(i + 1 + (currentPage - 1) * 10).padStart(4, '0')}`,
      customer: {
        id: i + 1,
        fullname: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'][i % 5],
        email: ['nguyenvana@example.com', 'tranthib@example.com', 'levanc@example.com', 'phamthid@example.com', 'hoangvane@example.com'][i % 5],
      },
      total_amount: Math.floor(Math.random() * 5000000) + 500000,
      status: statuses[i % statuses.length],
      payment_status: paymentStatuses[i % paymentStatuses.length],
      created_at: new Date(2026, 0, Math.floor(Math.random() * 28) + 1).toISOString(),
      updated_at: new Date(2026, 1, Math.floor(Math.random() * 4) + 1).toISOString(),
      items_count: Math.floor(Math.random() * 5) + 1,
    }));
  }, [currentPage]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        limit: number;
        search?: string;
        status?: OrderStatus;
      } = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      };

      const response = await adminApi.getAllOrders(params).catch(() => ({
        data: generateMockOrders(),
        total: 50,
        page: currentPage,
        limit: 10,
        totalPages: 5,
      }));

      setOrders(response.data);
      setTotalPages(response.totalPages);
      setTotalOrders(response.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      const mockOrders = generateMockOrders();
      setOrders(mockOrders);
      setTotalOrders(50);
      setTotalPages(5);
    } finally {
      setLoading(false);
    }
  }, [currentPage, generateMockOrders, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
      return;
    }

    setPageInput(String(currentPage));
  }, [currentPage, totalPages]);

  const handlePageJump = () => {
    const nextPage = Number.parseInt(pageInput, 10);

    if (!Number.isFinite(nextPage)) {
      setPageInput(String(currentPage));
      return;
    }

    const safeTotalPages = Math.max(1, totalPages);
    const normalizedPage = Math.min(Math.max(1, nextPage), safeTotalPages);

    setCurrentPage(normalizedPage);
    setPageInput(String(normalizedPage));
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    if (!newStatus) {
      return;
    }

    const currentOrder = orders.find((order) => order.id === orderId);
    if (!currentOrder || currentOrder.status === newStatus) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      await adminApi.updateOrderStatus(orderId, { status: newStatus });

      // Update the order in the list
      setOrders(currentOrders => currentOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Cập nhật trạng thái đơn hàng thất bại. Vui lòng thử lại.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-indigo-100 text-indigo-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-slate-200 text-slate-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAllowedStatusOptions = (currentStatus: string) => {
    const normalizedStatus = currentStatus as Exclude<OrderStatus, ''>;
    const nextStatuses = validStatusTransitions[normalizedStatus] ?? [];

    return [normalizedStatus, ...nextStatuses].map((status) => ({
      value: status,
      label: orderStatusLabels[status],
    }));
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Đang chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      refunded: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  const orderStatusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipped', label: 'Đã giao vận' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'refunded', label: 'Đã hoàn tiền' },
  ];

  const filteredOrders = orders.filter(order => {
    if (paymentFilter && order.payment_status !== paymentFilter) return false;
    return true;
  });

  const buildExportRows = useCallback((sourceOrders: AdminOrder[]) => {
    const exportDateFormatter = new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const paymentStatusLabelMap: Record<string, string> = {
      pending: 'Dang cho thanh toan',
      paid: 'Da thanh toan',
      failed: 'Thanh toan that bai',
      refunded: 'Da hoan tien',
    };

    return sourceOrders.map((order, index) => ({
      STT: index + 1,
      'Ma don hang': order.order_number,
      'Khach hang': order.customer?.fullname ?? 'Khach hang an danh',
      Email: order.customer?.email ?? '',
      'Ngay dat': exportDateFormatter.format(new Date(order.created_at)),
      'So san pham': order.items_count,
      'Tong tien (VND)': order.total_amount,
      'Trang thai don': orderStatusLabels[order.status as Exclude<OrderStatus, ''>] ?? order.status,
      'Thanh toan': paymentStatusLabelMap[order.payment_status] ?? order.payment_status,
    }));
  }, []);

  const writeOrdersToExcel = useCallback(async (sourceOrders: AdminOrder[], filePrefix: string) => {
    const XLSX = await import('xlsx');
    const rows = buildExportRows(sourceOrders);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DonHang');

    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  }, [buildExportRows]);

  const handleExportCurrentPage = useCallback(async () => {
    if (filteredOrders.length === 0 || isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      await writeOrdersToExcel(filteredOrders, `don_hang_admin_trang_${currentPage}`);
    } catch (error) {
      console.error('Failed to export current page orders to Excel:', error);
      alert('Xuất file Excel (trang hiện tại) thất bại. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  }, [currentPage, filteredOrders, isExporting, writeOrdersToExcel]);

  const handleExportAllPages = useCallback(async () => {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);

      const baseParams: {
        limit: number;
        search?: string;
        status?: OrderStatus;
      } = {
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      };

      const firstPageResponse = await adminApi.getAllOrders({
        ...baseParams,
        page: 1,
      });

      let allOrders: AdminOrder[] = [...firstPageResponse.data];

      if (firstPageResponse.totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: firstPageResponse.totalPages - 1 }, (_, index) =>
            adminApi.getAllOrders({
              ...baseParams,
              page: index + 2,
            })
          )
        );

        allOrders = allOrders.concat(...remainingPages.map((response) => response.data));
      }

      const allFilteredOrders = paymentFilter
        ? allOrders.filter((order) => order.payment_status === paymentFilter)
        : allOrders;

      if (allFilteredOrders.length === 0) {
        alert('Không có dữ liệu phù hợp để xuất tất cả trang.');
        return;
      }

      await writeOrdersToExcel(allFilteredOrders, 'don_hang_admin_tat_ca_trang');
    } catch (error) {
      console.error('Failed to export all orders to Excel:', error);
      alert('Xuất file Excel (tất cả trang) thất bại. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, paymentFilter, searchTerm, statusFilter, writeOrdersToExcel]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Đang tải đơn hàng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý đơn hàng</h1>
        <p className="text-slate-500">Quản lý đơn hàng khách hàng, cập nhật trạng thái và theo dõi giao hàng.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng đơn hàng</p>
              <p className="text-2xl font-bold mt-1">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Chờ xử lý</p>
              <p className="text-2xl font-bold mt-1">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Đang xử lý</p>
              <p className="text-2xl font-bold mt-1">
                {orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Đã giao</p>
              <p className="text-2xl font-bold mt-1">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng hoặc khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Bộ lọc</span>
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCurrentPage}
                disabled={filteredOrders.length === 0 || isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Đang xuất...' : 'Xuất trang hiện tại'}</span>
              </button>
              <button
                onClick={handleExportAllPages}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Đang xuất...' : 'Xuất tất cả trang'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Trạng thái đơn hàng</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              >
                {orderStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Trạng thái thanh toán</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              >
                <option value="">Tất cả trạng thái TT</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Khoảng thời gian</label>
              <input
                type="date"
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Orders Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Mã đơn hàng</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Khách hàng</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Ngày</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Sản phẩm</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Số tiền</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Thanh toán</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-medium">{order.order_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{order.customer?.fullname ?? 'Khách hàng ẩn danh'}</p>
                      <p className="text-sm text-slate-500">{order.customer?.email ?? 'Không có email'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className="text-slate-900 font-medium">{order.items_count} sản phẩm</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        title={
                          getAllowedStatusOptions(order.status).length > 1
                            ? `Có thể chuyển sang: ${getAllowedStatusOptions(order.status)
                              .slice(1)
                              .map((option) => option.label)
                              .join(', ')}`
                            : 'Trạng thái này không có bước chuyển tiếp tiếp theo'
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-[#7366ff] cursor-pointer ${getStatusColor(order.status)} ${updatingOrderId === order.id ? 'opacity-50' : ''
                          }`}
                      >
                        {getAllowedStatusOptions(order.status).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled
                        title="Order detail page is not available yet."
                        className="p-2 text-slate-400 rounded-lg cursor-not-allowed"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Update the order with the status dropdown instead."
                        className="p-2 text-slate-400 rounded-lg cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-500">
              Hiển thị trang {currentPage} / {totalPages} ({totalOrders} đơn hàng)
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 whitespace-nowrap">Đi tới trang</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handlePageJump();
                    }
                  }}
                  className="w-24 px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                  aria-label="Nhập số trang cần chuyển tới"
                />
                <span className="text-sm text-slate-500 whitespace-nowrap">/ {totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <button
                  onClick={handlePageJump}
                  className="px-4 py-2 bg-[#7366ff] text-white border border-[#7366ff] rounded-lg hover:bg-[#5d54cc] transition-colors"
                >
                  Đi
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy đơn hàng</h3>
          <p className="text-slate-500">Thử điều chỉnh bộ lọc hoặc tiêu chí tìm kiếm.</p>
        </div>
      )}
    </div>
  );
}
