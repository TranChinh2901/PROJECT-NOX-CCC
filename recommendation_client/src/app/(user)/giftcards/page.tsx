import { CreditCard, Gift, Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NavigationLandingPage } from '@/components/user/navigation/NavigationLandingPage';

export default function GiftCardsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <NavigationLandingPage
        badge="Thẻ quà tặng"
        title="Tặng TechNova credit để người nhận tự chọn đúng món họ cần."
        description="Thẻ quà tặng là lựa chọn gọn nhất khi bạn muốn tặng công nghệ nhưng không chắc chính xác model, màu sắc hoặc cấu hình mà người nhận muốn dùng."
        primaryAction={{
          label: 'Khám phá sản phẩm',
          href: '/',
        }}
        secondaryAction={{
          label: 'Tạo tài khoản',
          href: '/account/signup',
        }}
        stats={[
          { label: 'Mệnh giá linh hoạt', value: '5+' },
          { label: 'Phù hợp quà tặng', value: '100%' },
          { label: 'Áp dụng online', value: '24/7' },
        ]}
        highlights={[
          {
            title: 'Tặng đúng nhu cầu',
            description: 'Người nhận có thể tự cân đối giữa laptop, phụ kiện, thiết bị âm thanh hoặc món nhỏ hơn tùy thời điểm.',
            icon: Gift,
          },
          {
            title: 'Thanh toán linh hoạt',
            description: 'Dễ kết hợp với các chương trình khuyến mãi theo mùa để tăng giá trị đơn hàng mà không làm trải nghiệm phức tạp.',
            icon: CreditCard,
          },
          {
            title: 'Trình bày gọn gàng',
            description: 'Phù hợp cho quà sinh nhật, thưởng nội bộ hoặc gửi tặng khách hàng mà không phải đoán sở thích quá chi tiết.',
            icon: Sparkles,
          },
        ]}
      />
      <Footer />
    </div>
  );
}
