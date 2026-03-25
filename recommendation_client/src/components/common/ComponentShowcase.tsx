import React from 'react';
import { 
  Button,
  Badge,
  Rating,
  PriceDisplay,
  CategoryChip,
  SearchInput,
  ProductImage,
  EmptyState,
  FormInput,
  FeatureCard
} from '../common';
import { Laptop, Star, ShoppingCart } from 'lucide-react';

export const ComponentShowcase: React.FC = () => {
  const [searchValue, setSearchValue] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button leftIcon={<ShoppingCart className="w-4 h-4" />}>With Icon</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge>Mới</Badge>
          <Badge variant="success">Bán Chạy</Badge>
          <Badge variant="warning">Giảm Giá</Badge>
          <Badge variant="error">Hết Hàng</Badge>
          <Badge variant="info">Thông Tin</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Rating</h2>
        <div className="space-y-4">
          <Rating rating={4.5} reviewCount={128} />
          <Rating rating={3.8} size="sm" />
          <Rating rating={5} size="lg" showValue={false} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Price Display</h2>
        <div className="space-y-4">
          <PriceDisplay price={62500000} />
          <PriceDisplay price={62500000} originalPrice={69900000} size="lg" />
          <PriceDisplay price={24900000} originalPrice={29900000} size="sm" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Category Chip</h2>
        <div className="flex flex-wrap gap-4">
          <CategoryChip label="Laptop" icon={Laptop} />
          <CategoryChip 
            label="Điện Thoại" 
            isActive={activeCategory} 
            onClick={() => setActiveCategory(!activeCategory)}
          />
          <CategoryChip label="Âm Thanh" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Search Input</h2>
        <SearchInput 
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Tìm kiếm sản phẩm..."
          className="max-w-md"
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Product Image</h2>
        <div className="flex gap-4">
          <ProductImage category="laptops" size="sm" alt="Laptop" />
          <ProductImage category="smartphones" size="md" alt="Smartphone" />
          <ProductImage category="audio" size="lg" alt="Headphones" />
          <ProductImage category="gaming" size="xl" alt="Gaming" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Empty States</h2>
        <div className="space-y-8">
          <EmptyState type="search" />
          <EmptyState type="cart" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Form Input</h2>
        <div className="max-w-md space-y-4">
          <FormInput label="Họ Tên" placeholder="Nhập họ tên" />
          <FormInput 
            label="Email" 
            placeholder="Nhập email"
            leftIcon={<span>@</span>}
          />
          <FormInput 
            label="Mật khẩu"
            type="password"
            error="Mật khẩu phải có ít nhất 8 ký tự"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Feature Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard 
            title="Khuyến Mãi" 
            subtitle="Giảm giá đến 50%"
            color="#CA8A04"
          />
          <FeatureCard 
            title="Giao Hàng Nhanh" 
            subtitle="Nhận hàng trong 24h"
            color="#3B82F6"
          />
          <FeatureCard 
            title="Bảo Hành" 
            subtitle="Bảo hành 2 năm"
            icon={Star}
            color="#8B5CF6"
          />
        </div>
      </section>
    </div>
  );
};
