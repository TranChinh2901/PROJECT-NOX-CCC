'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '../../../../components/layout/Header';
import { Footer } from '../../../../components/layout/Footer';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Check,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  User
} from 'lucide-react';

const products = [
  {
    id: 1,
    name: 'Laptop Apex Pro',
    category: 'laptops',
    price: 62500000,
    originalPrice: 69900000,
    rating: 4.9,
    reviews: 128,
    badge: 'Bán Chạy',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    specs: ['Chip M3 Max', '32GB RAM', '1TB SSD', 'Pin 18 Giờ', 'Màn XDR'],
    inStock: true,
    description: 'Laptop Apex Pro đại diện cho đỉnh cao của máy tính di động. Được thiết kế cho các chuyên gia đòi hỏi hiệu suất không thỏa hiệp, laptop này sở hữu kiến trúc chip tiên tiến nhất, công nghệ màn hình tuyệt đẹp và pin kéo dài cả ngày.',
    features: [
      'Chip M3 Max với CPU 16 nhân và GPU 40 nhân',
      'Bộ nhớ thống nhất 32GB',
      'Ổ cứng SSD 1TB',
      'Thời lượng pin 18 giờ',
      'Màn hình Liquid Retina XDR 16 inch',
      'Camera FaceTime HD 1080p',
      'Hệ thống âm thanh 6 loa',
    ],
  },
  {
    id: 2,
    name: 'Điện Thoại Nova X',
    category: 'smartphones',
    price: 32475000,
    originalPrice: null,
    rating: 4.8,
    reviews: 256,
    badge: 'Mới',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop',
    specs: ['A18 Pro', '256GB', 'Titanium', 'Pin Cả Ngày', 'Camera 48MP'],
    inStock: true,
    description: 'Nova X kết hợp hiệu suất đỉnh cao với nghệ thuật tinh xảo. Với khung titanium hàng không vũ trụ, nhiếp ảnh tính toán tiên tiến và chip thông minh nhất từ trước đến nay.',
    features: [
      'Chip A18 Pro với GPU 6 nhân',
      'Màn hình Super Retina XDR 6.7 inch',
      'Camera chính 48MP với Telephoto 5x',
      'Thiết kế titanium với Ceramic Shield',
      'Pin kéo dài cả ngày',
      'Face ID',
      'Hỗ trợ 5G',
    ],
  },
  {
    id: 3,
    name: 'Máy Tính Titan Pro',
    category: 'desktops',
    price: 124975000,
    originalPrice: 137250000,
    rating: 5.0,
    reviews: 89,
    badge: 'Cao Cấp',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&h=800&fit=crop',
    specs: ['RTX 4090', '64GB RAM', '4TB NVMe', 'Tản Nhiệt Nước', 'Intel i9'],
    inStock: true,
    description: 'Trạm làm việc tối thượng cho người sáng tạo và chuyên gia. Hiệu suất vượt trội cho chỉnh sửa video 8K, kết xuất 3D và quy trình máy học.',
    features: [
      'Bộ xử lý Intel Core i9-14900K',
      'NVIDIA GeForce RTX 4090 24GB',
      'RAM DDR5 64GB',
      'SSD NVMe 4TB',
      'Hệ thống tản nhiệt nước tùy chỉnh',
      'Nguồn PSU 850W 80 Plus Gold',
    ],
  },
];

const reviews = [
  {
    id: 1,
    author: 'Nguyễn Văn An',
    rating: 5,
    date: '2 tuần trước',
    title: 'Hiệu suất tuyệt vời',
    content: 'Laptop này đã thay đổi hoàn toàn cách làm việc của tôi. Chip M3 Max xử lý mọi thứ tôi đưa vào - từ chỉnh sửa video 8K đến kết xuất 3D phức tạp. Thời lượng pin thực sự kéo dài cả ngày, và màn hình là tốt nhất tôi từng sử dụng.',
    verified: true,
    helpful: 45,
  },
  {
    id: 2,
    author: 'Trần Thị Bình',
    rating: 5,
    date: '1 tháng trước',
    title: 'Xứng đáng từng đồng',
    content: 'Là lập trình viên, tôi cần hiệu suất mạnh mẽ. Máy này biên dịch code nhanh hơn bất cứ thứ gì tôi từng sử dụng. Cảm giác bàn phím hoàn hảo, và bàn di chuột rất lớn và phản hồi tốt.',
    verified: true,
    helpful: 32,
  },
  {
    id: 3,
    author: 'Lê Hoàng Cường',
    rating: 4,
    date: '3 tuần trước',
    title: 'Tốt nhưng giá cao',
    content: 'Máy tuyệt vời với hiệu suất hàng đầu. Điểm duy nhất tôi chưa hài lòng là giá, nhưng bạn nhận được những gì bạn trả tiền. Chất lượng xây dựng đặc biệt và nó chạy hoàn toàn yên tĩnh trong điều kiện tải bình thường.',
    verified: true,
    helpful: 28,
  },
  {
    id: 4,
    author: 'Phạm Thị Dung',
    rating: 5,
    date: '1 tuần trước',
    title: 'Hoàn hảo cho chuyên gia sáng tạo',
    content: 'Tôi sử dụng cho công việc nhiếp ảnh và video. Độ chính xác màu của màn hình hiện tượng, và sức mạnh xử lý có nghĩa là không còn chờ đợi khi xuất file. Rất khuyến khích cho bất kỳ chuyên gia sáng tạo nào.',
    verified: true,
    helpful: 19,
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

const categoryNames: { [key: string]: string } = {
  laptops: 'Laptop',
  smartphones: 'Điện Thoại',
  desktops: 'Máy Tính Bàn',
};

export default function ProductPage() {
  const params = useParams();
  const productId = Number(params.id);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [cart, setCart] = useState<{id: number, quantity: number}[]>([]);

  const product = products.find(p => p.id === productId) || products[0];

  const addToCart = () => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: product.id, quantity }];
    });
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="min-h-screen bg-white mt-10">
      <Header cartItemCount={cartItemCount} />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <span className="hover:text-gray-900 cursor-pointer">Trang Chủ</span>
            <ChevronRight className="w-4 h-4" />
            <span className="hover:text-gray-900 cursor-pointer">{categoryNames[product.category] || product.category}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="relative">
              <GlassCard className="aspect-square overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#CA8A04]/5 to-transparent z-10" />
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </GlassCard>
              
              {product.badge && (
                <div className="absolute top-4 left-4 z-20 px-4 py-2 rounded-full bg-[#CA8A04] text-white text-sm font-semibold shadow-md">
                  {product.badge}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-gray-900 font-medium">{product.rating}</span>
                <span className="text-gray-500">({product.reviews} đánh giá)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-sm font-medium">
                      Tiết kiệm {discount}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {product.specs.map((spec, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm border border-gray-200"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center text-gray-900 font-semibold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  disabled={!product.inStock}
                  className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                    product.inStock
                      ? 'bg-[#CA8A04] text-white hover:bg-[#B47B04] active:scale-95 shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.inStock ? 'Thêm Vào Giỏ' : 'Hết Hàng'}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all bg-white shadow-sm">
                  <Heart className="w-5 h-5" />
                  <span className="hidden sm:inline">Yêu Thích</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all bg-white shadow-sm">
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Chia Sẻ</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="w-6 h-6 text-[#CA8A04]" />
                  <span className="text-xs text-gray-600">Miễn Phí Vận Chuyển</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Shield className="w-6 h-6 text-[#CA8A04]" />
                  <span className="text-xs text-gray-600">Bảo Hành 2 Năm</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="w-6 h-6 text-[#CA8A04]" />
                  <span className="text-xs text-gray-600">Đổi Trả 30 Ngày</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'description' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Mô Tả & Tính Năng
                {activeTab === 'description' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CA8A04]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'reviews' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Đánh Giá ({product.reviews})
                {activeTab === 'reviews' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CA8A04]" />
                )}
              </button>
            </div>
          </div>

          {activeTab === 'description' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">
                  Tính Năng Nổi Bật
                </h3>
                <ul className="space-y-3">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#CA8A04] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">
                  Trong Hộp Có Gì
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#CA8A04] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{product.name}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#CA8A04] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Củ Sạc USB-C</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#CA8A04] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Cáp USB-C (2m)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#CA8A04] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Tài Liệu Hướng Dẫn</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-8 p-6 rounded-xl bg-gray-50 border border-gray-200 mb-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-1">{product.rating}</div>
                  <div className="flex items-center gap-1 justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">{product.reviews} đánh giá</div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-16">{stars} sao</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div 
                          className="h-full bg-[#CA8A04] rounded-full"
                          style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : 10}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {stars === 5 ? '70%' : stars === 4 ? '20%' : '10%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{review.author}</div>
                          <div className="text-sm text-gray-500">{review.date}</div>
                        </div>
                      </div>
                      {review.verified && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs">
                          <Check className="w-3 h-3" />
                          Đã Mua Hàng
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                    <p className="text-gray-600 leading-relaxed mb-4">{review.content}</p>
                    <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      Hữu ích ({review.helpful})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
