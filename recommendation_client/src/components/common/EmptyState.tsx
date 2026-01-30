import React from 'react';
import { Search, ShoppingCart, Package } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'cart' | 'products' | 'general';
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const defaultContent = {
  search: {
    icon: Search,
    title: 'Không tìm thấy sản phẩm',
    description: 'Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc',
  },
  cart: {
    icon: ShoppingCart,
    title: 'Giỏ hàng trống',
    description: 'Thêm sản phẩm vào giỏ hàng để tiếp tục',
  },
  products: {
    icon: Package,
    title: 'Không có sản phẩm',
    description: 'Danh mục này hiện chưa có sản phẩm',
  },
  general: {
    icon: Package,
    title: 'Không có dữ liệu',
    description: 'Không tìm thấy dữ liệu phù hợp',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  action,
  className = '',
}) => {
  const content = defaultContent[type];
  const Icon = content.icon;

  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
        {title || content.title}
      </h3>
      <p className="text-gray-500 mb-6">
        {description || content.description}
      </p>
      {action}
    </div>
  );
};
