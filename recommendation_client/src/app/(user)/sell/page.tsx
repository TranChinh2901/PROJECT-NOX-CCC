import { BriefcaseBusiness, Boxes, Store } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NavigationLandingPage } from '@/components/user/navigation/NavigationLandingPage';

export default function SellPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <NavigationLandingPage
        badge="Bán hàng cùng TechNova"
        title="Dành cho đối tác muốn đưa sản phẩm của mình lên storefront."
        description="Nếu bạn có thương hiệu, danh mục linh kiện hoặc thiết bị muốn phân phối qua TechNova, đây là điểm bắt đầu để hiểu quy trình tiếp nhận và phối hợp vận hành."
        primaryAction={{
          label: 'Tạo tài khoản đối tác',
          href: '/account/signup',
        }}
        secondaryAction={{
          label: 'Xem dịch vụ hỗ trợ',
          href: '/service',
        }}
        stats={[
          { label: 'Onboarding rõ ràng', value: '3 bước' },
          { label: 'Danh mục phù hợp', value: 'Nhiều nhóm' },
          { label: 'Theo dõi vận hành', value: 'Minh bạch' },
        ]}
        highlights={[
          {
            title: 'Tiếp nhận danh mục',
            description: 'Đối soát SKU, mô tả, hình ảnh và cấu trúc danh mục để sản phẩm vào hệ thống đúng chuẩn storefront.',
            icon: Boxes,
          },
          {
            title: 'Phối hợp bán hàng',
            description: 'Làm rõ mức tồn kho, giá bán, thông tin bảo hành và cách xử lý sau bán để tránh đứt gãy trải nghiệm khách hàng.',
            icon: Store,
          },
          {
            title: 'Làm việc có đầu mối',
            description: 'Quy trình dành cho đối tác cần người phụ trách cụ thể, không phải gửi lòng vòng rồi chờ phản hồi không rõ ràng.',
            icon: BriefcaseBusiness,
          },
        ]}
      />
      <Footer />
    </div>
  );
}
