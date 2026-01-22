import 'reflect-metadata';
import { AppDataSource } from '@/config/database.config';
import { User } from '@/modules/users/entity/user.entity';
import { Category } from '@/modules/categories/entity/category.entity';
import { Brand } from '@/modules/brands/entity/brand.entity';
import { Product } from '@/modules/products/entity/product.entity';
import { Blog } from '@/modules/blogs/entity/blog.entity';
import { Color } from '@/modules/colors/entity/color.entity';
import { Voucher } from '@/modules/vouchers/entity/voucher.entity';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';

async function seed() {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected for seeding');

    // Clear existing data (in reverse order of dependencies)
    await AppDataSource.getRepository(Voucher).delete({});
    await AppDataSource.getRepository(Blog).delete({});
    await AppDataSource.getRepository(Product).delete({});
    await AppDataSource.getRepository(Category).delete({});
    await AppDataSource.getRepository(Brand).delete({});
    await AppDataSource.getRepository(Color).delete({});
    await AppDataSource.getRepository(User).delete({});
    logger.info('Cleared existing data');

    // Seed Users
    const users = [
      {
        username: 'admin',
        email: 'admin@ndstyle.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        is_active: true
      },
      {
        username: 'customer1',
        email: 'customer1@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'customer',
        is_active: true
      },
      {
        username: 'customer2',
        email: 'customer2@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'customer',
        is_active: true
      }
    ];

    const userRepo = AppDataSource.getRepository(User);
    await userRepo.save(users);
    logger.info('Seeded users');

    // Seed Brands
    const brands = [
      {
        name_brand: 'ND Style',
        logo_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/nds-logo.png',
        description_brand: 'Thương hiệu thời trang nội địa cao cấp'
      },
      {
        name_brand: 'Nike',
        logo_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/nike-logo.png',
        description_brand: 'Thương hiệu thể thao toàn cầu'
      },
      {
        name_brand: 'Adidas',
        logo_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/adidas-logo.png',
        description_brand: 'Thương hiệu thể thao Đức'
      },
      {
        name_brand: 'Zara',
        logo_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/zara-logo.png',
        description_brand: 'Thời trang cao cấp từ Tây Ban Nha'
      },
      {
        name_brand: 'H&M',
        logo_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/hm-logo.png',
        description_brand: 'Thời trang phù hợp mọi lứa tuổi'
      },
      {
        name_brand: 'Uniqlo',
        logo_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/uniqlo-logo.png',
        description_brand: 'Thời trang cơ bản Nhật Bản'
      }
    ];

    const brandRepo = AppDataSource.getRepository(Brand);
    const savedBrands = await brandRepo.save(brands);
    logger.info('Seeded brands');

    // Seed Categories
    const categories = [
      // Đồ nam
      {
        name_category: 'Áo Sơ Mi Nam',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-so-mi-nam.jpg',
        description_category: 'Áo sơ mi nam chính hãng',
        brand: savedBrands[0]
      },
      {
        name_category: 'Áo Polo Nam',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-polo-nam.jpg',
        description_category: 'Áo polo nam thời trang',
        brand: savedBrands[0]
      },
      {
        name_category: 'Áo Thun Nam',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-thun-nam.jpg',
        description_category: 'Áo thun nam mát mẻ',
        brand: savedBrands[0]
      },
      {
        name_category: 'Quần Tây Nam',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/quan-tay-nam.jpg',
        description_category: 'Quần tây nam lịch lãm',
        brand: savedBrands[0]
      },
      {
        name_category: 'Quần Jeans Nam',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/quan-jeans-nam.jpg',
        description_category: 'Quần jeans nam năng động',
        brand: savedBrands[0]
      },
      // Đồ nữ
      {
        name_category: 'Áo Sơ Mi Nữ',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-so-mi-nu.jpg',
        description_category: 'Áo sơ mi nữ thanh lịch',
        brand: savedBrands[0]
      },
      {
        name_category: 'Váy',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/vay.jpg',
        description_category: 'Váy thời trang nữ',
        brand: savedBrands[0]
      },
      {
        name_category: 'Chân Váy',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/chan-vay.jpg',
        description_category: 'Chân váy xinh xắn',
        brand: savedBrands[0]
      },
      {
        name_category: 'Áo Khoác Nữ',
        image_category: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-khoac-nu.jpg',
        description_category: 'Áo khoác nữ ấm áp',
        brand: savedBrands[0]
      }
    ];

    const categoryRepo = AppDataSource.getRepository(Category);
    const savedCategories = await categoryRepo.save(categories);
    logger.info('Seeded categories');

    // Seed Colors
    const colors = [
      { name_color: 'Đen', code_color: '#000000' },
      { name_color: 'Trắng', code_color: '#FFFFFF' },
      { name_color: 'Xám', code_color: '#808080' },
      { name_color: 'Xanh Navy', code_color: '#000080' },
      { name_color: 'Đỏ', code_color: '#FF0000' },
      { name_color: 'Xanh lá', code_color: '#00FF00' },
      { name_color: 'Vàng', code_color: '#FFFF00' },
      { name_color: 'Hồng', code_color: '#FFC0CB' },
      { name_color: 'Nâu', code_color: '#A52A2A' }
    ];

    const colorRepo = AppDataSource.getRepository(Color);
    await colorRepo.save(colors);
    logger.info('Seeded colors');

    // Seed Products
    const products = [
      // Áo sơ mi nam
      {
        name_product: 'Áo Sơ Mi Nam Regular Fit',
        price: 599000,
        origin_price: 699000,
        small_description: 'Áo sơ mi nam chất liệu cotton mềm mại, thấm hút mồ hôi tốt',
        full_description: 'Áo sơ mi nam thiết kế classic, phù hợp đi làm và dự tiệc. Chất liệu 100% cotton cao cấp, mềm mại, thoáng mát.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nam-1.jpg',
        status: 'active',
        stock_quantity: 100,
        discount: 14,
        category: savedCategories[0],
        brand: savedBrands[3]
      },
      {
        name_product: 'Áo Sơ Mi Nam Slim Fit',
        price: 649000,
        origin_price: 799000,
        small_description: 'Áo sơ mi nam form slim, tôn dáng',
        full_description: 'Áo sơ mi nam form slim, thiết kế hiện đại, tôn dáng người mặc.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nam-2.jpg',
        status: 'active',
        stock_quantity: 80,
        discount: 19,
        category: savedCategories[0],
        brand: savedBrands[4]
      },
      // Áo polo nam
      {
        name_product: 'Áo Polo Nam Classic',
        price: 399000,
        origin_price: 499000,
        small_description: 'Áo polo nam phong cách classic',
        full_description: 'Áo polo nam chất liệu Pique cotton, thoáng mát, thấm hút mồ hôi.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-polo-nam-1.jpg',
        status: 'active',
        stock_quantity: 120,
        discount: 20,
        category: savedCategories[1],
        brand: savedBrands[1]
      },
      {
        name_product: 'Áo Polo Nam Sport',
        price: 499000,
        origin_price: 599000,
        small_description: 'Áo polo nam phong cách thể thao',
        full_description: 'Áo polo nam dành cho hoạt động thể thao, co giãn tốt.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-polo-nam-2.jpg',
        status: 'active',
        stock_quantity: 90,
        discount: 17,
        category: savedCategories[1],
        brand: savedBrands[2]
      },
      // Áo thun nam
      {
        name_product: 'Áo Thun Nam Basic',
        price: 199000,
        origin_price: 249000,
        small_description: 'Áo thun nam basic đa năng',
        full_description: 'Áo thun nam basic, màu sắc đa dạng, dễ phối đồ.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-thun-nam-1.jpg',
        status: 'active',
        stock_quantity: 150,
        discount: 20,
        category: savedCategories[2],
        brand: savedBrands[5]
      },
      {
        name_product: 'Áo Thun Nam Graphic',
        price: 299000,
        origin_price: 399000,
        small_description: 'Áo thun nam họa tiết nổi bật',
        full_description: 'Áo thun nam với họa tiết trẻ trung, năng động.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-thun-nam-2.jpg',
        status: 'active',
        stock_quantity: 100,
        discount: 25,
        category: savedCategories[2],
        brand: savedBrands[0]
      },
      // Quần tây nam
      {
        name_product: 'Quần Tây Nam Dress',
        price: 799000,
        origin_price: 999000,
        small_description: 'Quần tây nam lịch lãm',
        full_description: 'Quần tây nam dress, phù hợp đi làm, dự tiệc, form chuẩn.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-tay-nam-1.jpg',
        status: 'active',
        stock_quantity: 60,
        discount: 20,
        category: savedCategories[3],
        brand: savedBrands[3]
      },
      {
        name_product: 'Quần Tây Nam Casual',
        price: 599000,
        origin_price: 799000,
        small_description: 'Quần tây nam phong cách casual',
        full_description: 'Quần tây nam casual, thoải mái, phù hợp đi chơi.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-tay-nam-2.jpg',
        status: 'active',
        stock_quantity: 80,
        discount: 25,
        category: savedCategories[3],
        brand: savedBrands[4]
      },
      // Quần jeans nam
      {
        name_product: 'Quần Jeans Nam Skinny',
        price: 699000,
        origin_price: 899000,
        small_description: 'Quần jeans nam skinny fit',
        full_description: 'Quần jeans nam skinny fit, ôm vừa vặn, tôn dáng.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-jeans-nam-1.jpg',
        status: 'active',
        stock_quantity: 100,
        discount: 22,
        category: savedCategories[4],
        brand: savedBrands[1]
      },
      {
        name_product: 'Quần Jeans Nam Regular',
        price: 649000,
        origin_price: 849000,
        small_description: 'Quần jeans nam regular fit',
        full_description: 'Quần jeans nam regular fit, thoải mái, phù hợp mọi dáng người.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-jeans-nam-2.jpg',
        status: 'active',
        stock_quantity: 90,
        discount: 24,
        category: savedCategories[4],
        brand: savedBrands[2]
      },
      // Áo sơ mi nữ
      {
        name_product: 'Áo Sơ Mi Nữ Classic',
        price: 549000,
        origin_price: 699000,
        small_description: 'Áo sơ mi nữ thanh lịch',
        full_description: 'Áo sơ mi nữ classic, phù hợp đi làm, dự tiệc, phong cách nhẹ nhàng.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nu-1.jpg',
        status: 'active',
        stock_quantity: 80,
        discount: 21,
        category: savedCategories[5],
        brand: savedBrands[3]
      },
      {
        name_product: 'Áo Sơ Mi Nữ Silk',
        price: 899000,
        origin_price: 1199000,
        small_description: 'Áo sơ mi nữ chất liệu lụa cao cấp',
        full_description: 'Áo sơ mi nữ chất liệu lụa mềm mại, sang trọng.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nu-2.jpg',
        status: 'active',
        stock_quantity: 50,
        discount: 25,
        category: savedCategories[5],
        brand: savedBrands[4]
      },
      // Váy
      {
        name_product: 'Váy Midi Hoa Nhí',
        price: 459000,
        origin_price: 650000,
        small_description: 'Váy midi họa tiết hoa nhí xinh xắn',
        full_description: 'Váy midi họa tiết hoa nhí, phong cách vintage, nữ tính.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/vay-1.jpg',
        status: 'active',
        stock_quantity: 70,
        discount: 29,
        category: savedCategories[6],
        brand: savedBrands[0]
      },
      {
        name_product: 'Váy Maxi Dài',
        price: 799000,
        origin_price: 999000,
        small_description: 'Váy maxi dài phong cách bohem',
        full_description: 'Váy maxi dài phong cách bohem, thoải mái, phù hợp đi biển.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/vay-2.jpg',
        status: 'active',
        stock_quantity: 60,
        discount: 20,
        category: savedCategories[6],
        brand: savedBrands[3]
      },
      // Chân váy
      {
        name_product: 'Chân Váy Bút Chì',
        price: 399000,
        origin_price: 499000,
        small_description: 'Chân váy bút chì lịch sự',
        full_description: 'Chân váy bút chì form ôm, lịch sự, phù hợp đi làm.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/chan-vay-1.jpg',
        status: 'active',
        stock_quantity: 90,
        discount: 20,
        category: savedCategories[7],
        brand: savedBrands[4]
      },
      {
        name_product: 'Chân Váy Xòe',
        price: 459000,
        origin_price: 599000,
        small_description: 'Chân váy xòe nữ tính',
        full_description: 'Chân váy xòe phong cách nữ tính, dễ thương.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/chan-vay-2.jpg',
        status: 'active',
        stock_quantity: 80,
        discount: 23,
        category: savedCategories[7],
        brand: savedBrands[5]
      },
      // Áo khoác nữ
      {
        name_product: 'Áo Khoác Denim',
        price: 699000,
        origin_price: 899000,
        small_description: 'Áo khoác denim nữ phong cách trẻ trung',
        full_description: 'Áo khoác denim nữ, phong cách trẻ trung, năng động.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-khoac-nu-1.jpg',
        status: 'active',
        stock_quantity: 70,
        discount: 22,
        category: savedCategories[8],
        brand: savedBrands[0]
      },
      {
        name_product: 'Áo Khoác Cardigan',
        price: 599000,
        origin_price: 799000,
        small_description: 'Áo khoác cardigan nữ ấm áp',
        full_description: 'Áo khoác cardigan nữ, ấm áp, phù hợp mặc hàng ngày.',
        image_product: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-khoac-nu-2.jpg',
        status: 'active',
        stock_quantity: 75,
        discount: 25,
        category: savedCategories[8],
        brand: savedBrands[5]
      }
    ];

    const productRepo = AppDataSource.getRepository(Product);
    await productRepo.save(products);
    logger.info('Seeded products');

    // Seed Blogs
    const blogs = [
      {
        title: 'Xu Hướng Thời Trang Thu Đông 2025',
        content: 'Khám phá xu hướng thời trang mới nhất cho mùa thu đông...',
        image_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-1.jpg',
        category: 'Xu hướng',
        author: 'ND Style Team',
        status: 'published'
      },
      {
        title: 'Cách Phối Đồ Cho Mùa Hè',
        content: 'Hướng dẫn phối đồ mùa hè thanh mát và năng động...',
        image_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-2.jpg',
        category: 'Phong cách',
        author: 'ND Style Team',
        status: 'published'
      },
      {
        title: 'Chăm Sóc Quần Áo Đúng Cách',
        content: 'Những mẹo hay giúp quần áo bền màu và giữ form dáng...',
        image_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-3.jpg',
        category: 'Chăm sóc',
        author: 'ND Style Team',
        status: 'published'
      },
      {
        title: 'Bộ Sưu Tập Mới ND Style',
        content: 'Giới thiệu bộ sưu tập mới nhất từ ND Style...',
        image_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-4.jpg',
        category: 'Sản phẩm',
        author: 'ND Style Team',
        status: 'published'
      },
      {
        title: 'Phong Cách Thời Trang Công Sở',
        content: 'Tạo dáng vẻ chuyên nghiệp với những trang phục phù hợp...',
        image_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-5.jpg',
        category: 'Phong cách',
        author: 'ND Style Team',
        status: 'published'
      },
      {
        title: 'Về Chúng Tôi',
        content: 'Câu chuyện thành lập thương hiệu ND Style...',
        image_url: 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-6.jpg',
        category: 'Về chúng tôi',
        author: 'ND Style Team',
        status: 'published'
      }
    ];

    const blogRepo = AppDataSource.getRepository(Blog);
    await blogRepo.save(blogs);
    logger.info('Seeded blogs');

    // Seed Vouchers
    const vouchers = [
      {
        code_voucher: 'WELCOME10',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 500000,
        max_discount_amount: 100000,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        usage_limit: 1000,
        used_count: 0,
        is_active: true
      },
      {
        code_voucher: 'SUMMER20',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_amount: 1000000,
        max_discount_amount: 200000,
        start_date: new Date(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        usage_limit: 500,
        used_count: 0,
        is_active: true
      },
      {
        code_voucher: 'FIXED50K',
        discount_type: 'fixed',
        discount_value: 50000,
        min_order_amount: 300000,
        max_discount_amount: 50000,
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        usage_limit: 2000,
        used_count: 0,
        is_active: true
      }
    ];

    const voucherRepo = AppDataSource.getRepository(Voucher);
    await voucherRepo.save(vouchers);
    logger.info('Seeded vouchers');

    logger.success('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
