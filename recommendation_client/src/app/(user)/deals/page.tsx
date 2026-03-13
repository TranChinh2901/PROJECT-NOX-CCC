import { BadgePercent, PackageSearch, Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NavigationLandingPage } from '@/components/user/navigation/NavigationLandingPage';

export default function DealsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <NavigationLandingPage
        badge="Khuyến mãi hôm nay"
        title="Ưu đãi đang chạy trong ngày, không cần mò từng danh mục."
        description="Trang này gom các nhịp giảm giá, deal theo mùa và gợi ý sản phẩm đang đáng mua để khách hàng không phải tự dò toàn bộ storefront."
        primaryAction={{
          label: 'Xem tất cả sản phẩm',
          href: '/',
        }}
        secondaryAction={{
          label: 'Vào giỏ hàng',
          href: '/cart',
        }}
        stats={[
          { label: 'Deal nổi bật', value: 'Hằng ngày' },
          { label: 'Danh mục áp dụng', value: 'Nhiều nhóm' },
          { label: 'Mốc giao hàng', value: 'Rõ ràng' },
        ]}
        highlights={[
          {
            title: 'Ưu đãi dễ quét',
            description: 'Khách hàng có thể nhận biết ngay đâu là deal nổi bật thay vì lẫn trong một lưới sản phẩm quá dày.',
            icon: BadgePercent,
          },
          {
            title: 'Sản phẩm đáng chú ý',
            description: 'Tập trung vào các mẫu đang có sức mua, còn hàng và phù hợp với các nhu cầu phổ biến nhất trong ngày.',
            icon: PackageSearch,
          },
          {
            title: 'Khuyến mãi có chọn lọc',
            description: 'Không đẩy quá nhiều tín hiệu cùng lúc; ưu tiên những ưu đãi có giá trị thật và dễ hiểu.',
            icon: Sparkles,
          },
        ]}
      />
      <Footer />
    </div>
  );
}
