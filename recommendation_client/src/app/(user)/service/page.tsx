import { Headset, ShieldCheck, Truck } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CustomerFeedbackForm } from '@/components/user/feedback/CustomerFeedbackForm';
import { NavigationLandingPage } from '@/components/user/navigation/NavigationLandingPage';

export default function ServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <NavigationLandingPage
        badge="Dịch vụ khách hàng"
        title="Hỗ trợ nhanh, rõ ràng và có người xử lý thật."
        description="Trang này tổng hợp các cam kết hỗ trợ của TechNova: tư vấn trước khi mua, theo dõi đơn hàng sau khi mua, và hướng dẫn xử lý khi có sự cố phát sinh."
        primaryAction={{
          label: 'Theo dõi đơn hàng',
          href: '/account/orders',
        }}
        secondaryAction={{
          label: 'Về trang chủ',
          href: '/',
        }}
        stats={[
          { label: 'Phản hồi đầu tiên', value: '< 15p' },
          { label: 'Kênh hỗ trợ', value: '4' },
          { label: 'Hỗ trợ sau mua', value: '7 ngày' },
        ]}
        highlights={[
          {
            title: 'Tư vấn trước khi mua',
            description: 'Giúp khách hàng chọn đúng cấu hình, phụ kiện và phương án giao hàng thay vì tự đoán từ tên sản phẩm.',
            icon: Headset,
          },
          {
            title: 'Bảo vệ đơn hàng',
            description: 'Xác nhận trạng thái, tiến độ giao và những mốc thay đổi quan trọng để tránh đơn hàng bị mơ hồ.',
            icon: ShieldCheck,
          },
          {
            title: 'Hỗ trợ giao nhận',
            description: 'Kiểm tra địa chỉ, cập nhật điều phối và xử lý các trường hợp giao lại hoặc thay đổi thời gian nhận.',
            icon: Truck,
          },
        ]}
      />
      <CustomerFeedbackForm />
      <Footer />
    </div>
  );
}
