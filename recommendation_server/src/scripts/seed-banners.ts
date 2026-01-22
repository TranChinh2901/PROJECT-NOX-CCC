import 'reflect-metadata';
import { AppDataSource } from '@/database/connect-database';
import { Banner } from '@/modules/banners/entity/banner.entity';

async function seedBanners() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const bannerRepository = AppDataSource.getRepository(Banner);

    // Clear existing banners
    await bannerRepository.clear();
    console.log('Cleared existing banners');

    // Create default banners
    const banners = [
      {
        title: 'BỘ SƯU TẬP THU ĐÔNG 2025',
        subtitle: 'Phong cách mới, Ấm áp cho mùa lạnh',
        description: 'Săn ngay deal hot với giá ưu đãi lên đến 50%',
        image_url: 'https://bizweb.dktcdn.net/100/534/571/themes/972900/assets/slider_1.png?1749442635150',
        button_text: 'MUA NGAY',
        button_link: '/collections/thu-dong-2025',
        is_active: true,
        display_order: 1,
      },
      {
        title: 'ĐỒ MẶC CẢ NHÀ, ÊM ÁI CẢ NGÀY',
        subtitle: 'Thoải mái tối đa cho không gian gia đình',
        description: 'Chất liệu cao cấp, thiết kế tinh tế',
        image_url: 'https://bizweb.dktcdn.net/100/534/571/themes/972900/assets/slider_2.png?1749442635150',
        button_text: 'XEM COLLECTION',
        button_link: '/collections/do-mac-nha',
        is_active: true,
        display_order: 2,
      },
      {
        title: 'PHÁI ĐẸP ĐỂ YÊU',
        subtitle: 'Vạn deal cưng chiều',
        description: 'Phong cách thời trang trẻ trung, hiện đại',
        image_url: 'https://bizweb.dktcdn.net/100/534/571/themes/972900/assets/slider_3.png?1749442635150',
        button_text: 'SHOPPING NGAY',
        button_link: '/collections/phai-dep',
        is_active: true,
        display_order: 3,
      },
    ];

    const savedBanners = await bannerRepository.save(banners);
    console.log(`Created ${savedBanners.length} banners successfully`);

    console.log('Seed banners completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding banners:', error);
    process.exit(1);
  }
}

seedBanners();
