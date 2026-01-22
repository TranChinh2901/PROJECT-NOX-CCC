SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data
DELETE FROM cart_items;
DELETE FROM order_details;
DELETE FROM orders;
DELETE FROM carts;
DELETE FROM product_variants;
DELETE FROM product_gallery;
DELETE FROM reviews;
DELETE FROM vouchers;
DELETE FROM blogs;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM brands;
DELETE FROM colors;
DELETE FROM shipping_address;
DELETE FROM transactions;
DELETE FROM cancel_order;
DELETE FROM users;

-- Reset auto increment
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE brands AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE blogs AUTO_INCREMENT = 1;

-- Insert Users (password: '123456')
INSERT INTO users (id, fullname, email, phone_number, password, role, is_verified) VALUES
(1, 'Admin ND Style', 'admin@ndstyle.com', '0123456789', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 1),
(2, 'Khách hàng 1', 'customer1@example.com', '0987654321', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER', 1),
(3, 'Khách hàng 2', 'customer2@example.com', '0123456788', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER', 1);

-- Insert Brands
INSERT INTO brands (id, name_brand, logo_url, description_brand) VALUES
(1, 'ND Style', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/nds-logo.png', 'Thương hiệu thời trang nội địa cao cấp'),
(2, 'Nike', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/nike-logo.png', 'Thương hiệu thể thao toàn cầu'),
(3, 'Adidas', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/adidas-logo.png', 'Thương hiệu thể thao Đức'),
(4, 'Zara', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/zara-logo.png', 'Thời trang cao cấp từ Tây Ban Nha'),
(5, 'H&M', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/hm-logo.png', 'Thời trang phù hợp mọi lứa tuổi'),
(6, 'Uniqlo', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759764743/brand-images/uniqlo-logo.png', 'Thời trang cơ bản Nhật Bản');

-- Insert Categories
INSERT INTO categories (id, name_category, image_category, description_category, brand_id) VALUES
(1, 'Áo Sơ Mi Nam', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-so-mi-nam.jpg', 'Áo sơ mi nam chính hãng', 1),
(2, 'Áo Polo Nam', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-polo-nam.jpg', 'Áo polo nam thời trang', 1),
(3, 'Áo Thun Nam', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-thun-nam.jpg', 'Áo thun nam mát mẻ', 1),
(4, 'Quần Tây Nam', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/quan-tay-nam.jpg', 'Quần tây nam lịch lãm', 1),
(5, 'Quần Jeans Nam', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/quan-jeans-nam.jpg', 'Quần jeans nam năng động', 1),
(6, 'Áo Sơ Mi Nữ', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-so-mi-nu.jpg', 'Áo sơ mi nữ thanh lịch', 1),
(7, 'Váy', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/vay.jpg', 'Váy thời trang nữ', 1),
(8, 'Chân Váy', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/chan-vay.jpg', 'Chân váy xinh xắn', 1),
(9, 'Áo Khoác Nữ', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769278/category-images/ao-khoac-nu.jpg', 'Áo khoác nữ ấm áp', 1);

-- Insert Colors
INSERT INTO colors (id, name_color, product_id) VALUES
(1, 'Đen', 1),
(2, 'Trắng', 1),
(3, 'Xám', 2),
(4, 'Xanh Navy', 3),
(5, 'Đỏ', 4),
(6, 'Xanh lá', 5),
(7, 'Vàng', 6),
(8, 'Hồng', 7),
(9, 'Nâu', 8);

-- Insert Products
INSERT INTO products (id, name_product, price, origin_price, small_description, meta_description, image_product, status, stock_quantity, discount, category_id, brand_id) VALUES
(1, 'Áo Sơ Mi Nam Regular Fit', 599000, 699000, 'Áo sơ mi nam chất liệu cotton mềm mại, thấm hút mồ hôi tốt', 'Áo sơ mi nam thiết kế classic, phù hợp đi làm và dự tiệc. Chất liệu 100% cotton cao cấp, mềm mại, thoáng mát. Form Regular Fit thoải mái, dễ mặc.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nam-1.jpg', 'active', 100, 14, 1, 4),
(2, 'Áo Sơ Mi Nam Slim Fit', 649000, 799000, 'Áo sơ mi nam form slim, tôn dáng', 'Áo sơ mi nam form slim, thiết kế hiện đại, tôn dáng người mặc. Chất liệu cotton cao cấp, mềm mại, ít nhăn.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nam-2.jpg', 'active', 80, 19, 1, 5),
(3, 'Áo Polo Nam Classic', 399000, 499000, 'Áo polo nam phong cách classic', 'Áo polo nam chất liệu Pique cotton, thoáng mát, thấm hút mồ hôi tốt. Phù hợp cho hoạt động hàng ngày và thể thao nhẹ.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-polo-nam-1.jpg', 'active', 120, 20, 2, 2),
(4, 'Áo Polo Nam Sport', 499000, 599000, 'Áo polo nam phong cách thể thao', 'Áo polo nam dành cho hoạt động thể thao, co giãn tốt. Chất liệu Dry-fit giúp thoát ẩm nhanh, giữ cơ thể luôn khô thoáng.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-polo-nam-2.jpg', 'active', 90, 17, 2, 3),
(5, 'Áo Thun Nam Basic', 199000, 249000, 'Áo thun nam basic đa năng', 'Áo thun nam basic, màu sắc đa dạng, dễ phối đồ. Chất liệu cotton 100%, mềm mại, thoáng mát. Phù hợp mặc hàng ngày.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-thun-nam-1.jpg', 'active', 150, 20, 3, 6),
(6, 'Áo Thun Nam Graphic', 299000, 399000, 'Áo thun nam họa tiết nổi bật', 'Áo thun nam với họa tiết trẻ trung, năng động. Thiết kế hiện đại, phù hợp với phong cách trẻ.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-thun-nam-2.jpg', 'active', 100, 25, 3, 1),
(7, 'Quần Tây Nam Dress', 799000, 999000, 'Quần tây nam lịch lãm', 'Quần tây nam dress, phù hợp đi làm, dự tiệc, form chuẩn. Chất liệu vải cao cấp, không phai màu, bền đẹp theo thời gian.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-tay-nam-1.jpg', 'active', 60, 20, 4, 4),
(8, 'Quần Tây Nam Casual', 599000, 799000, 'Quần tây nam phong cách casual', 'Quần tây nam casual, thoải mái, phù hợp đi chơi. Form suông, dễ phối đồ. Phù hợp cho nhiều dịp khác nhau.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-tay-nam-2.jpg', 'active', 80, 25, 4, 5),
(9, 'Quần Jeans Nam Skinny', 699000, 899000, 'Quần jeans nam skinny fit', 'Quần jeans nam skinny fit, ôm vừa vặn, tôn dáng. Chất liệu denim cao cấp, bền đẹp, co giãn tốt.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-jeans-nam-1.jpg', 'active', 100, 22, 5, 2),
(10, 'Quần Jeans Nam Regular', 649000, 849000, 'Quần jeans nam regular fit', 'Quần jeans nam regular fit, thoải mái, phù hợp mọi dáng người. Thiết kế classic, dễ phối đồ.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/quan-jeans-nam-2.jpg', 'active', 90, 24, 5, 3),
(11, 'Áo Sơ Mi Nữ Classic', 549000, 699000, 'Áo sơ mi nữ thanh lịch', 'Áo sơ mi nữ classic, phù hợp đi làm, dự tiệc, phong cách nhẹ nhàng. Chất liệu cotton mềm mại, thoáng mát.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nu-1.jpg', 'active', 80, 21, 6, 4),
(12, 'Áo Sơ Mi Nữ Silk', 899000, 1199000, 'Áo sơ mi nữ chất liệu lụa cao cấp', 'Áo sơ mi nữ chất liệu lụa mềm mại, sang trọng. Thiết kế thanh lịch, phù hợp với nhiều dịp quan trọng.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-so-mi-nu-2.jpg', 'active', 50, 25, 6, 5),
(13, 'Váy Midi Hoa Nhí', 459000, 650000, 'Váy midi họa tiết hoa nhí xinh xắn', 'Váy midi họa tiết hoa nhí, phong cách vintage, nữ tính. Phù hợp cho dạ hội, đi chơi, dự tiệc.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/vay-1.jpg', 'active', 70, 29, 7, 1),
(14, 'Váy Maxi Dài', 799000, 999000, 'Váy maxi dài phong cách bohem', 'Váy maxi dài phong cách bohem, thoải mái, phù hợp đi biển, đi du lịch. Chất liệu mềm mại, thoáng mát.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/vay-2.jpg', 'active', 60, 20, 7, 4),
(15, 'Chân Váy Bút Chì', 399000, 499000, 'Chân váy bút chì lịch sự', 'Chân váy bút chì form ôm, lịch sự, phù hợp đi làm. Chất liệu co giãn, tôn dáng người mặc.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/chan-vay-1.jpg', 'active', 90, 20, 8, 5),
(16, 'Chân Váy Xòe', 459000, 599000, 'Chân váy xòe nữ tính', 'Chân váy xòe phong cách nữ tính, dễ thương. Phù hợp cho các buổi tiệc, đi chơi, dạ hội.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/chan-vay-2.jpg', 'active', 80, 23, 8, 6),
(17, 'Áo Khoác Denim', 699000, 899000, 'Áo khoác denim nữ phong cách trẻ trung', 'Áo khoác denim nữ, phong cách trẻ trung, năng động. Chất liệu bền đẹp, phù hợp mặc hàng ngày.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-khoac-nu-1.jpg', 'active', 70, 22, 9, 1),
(18, 'Áo Khoác Cardigan', 599000, 799000, 'Áo khoác cardigan nữ ấm áp', 'Áo khoác cardigan nữ, ấm áp, phù hợp mặc hàng ngày. Chất liệu mềm mại, nhẹ nhàng, dễ phối đồ.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769478/products/ao-khoac-nu-2.jpg', 'active', 75, 25, 9, 6);

-- Insert Blogs
INSERT INTO blogs (id, title, content, image_blogs, status, author_id) VALUES
(1, 'Xu Hướng Thời Trang Thu Đông 2025', 'Khám phá xu hướng thời trang mới nhất cho mùa thu đông với những gam màu ấm áp và thiết kế hiện đại. Các nhà thiết kế hàng đầu thế giới đều hướng đến sự thoải mái tối đa kết hợp cùng vẻ ngoài thanh lịch.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-1.jpg', 'active', 1),
(2, 'Cách Phối Đồ Cho Mùa Hè', 'Hướng dẫn phối đồ mùa hè thanh mát và năng động với những gợi ý từ các chuyên gia thời trang. Chọn trang phục phù hợp với thời tiết nóng ẩm.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-2.jpg', 'active', 1),
(3, 'Chăm Sóc Quần Áo Đúng Cách', 'Những mẹo hay giúp quần áo bền màu và giữ form dáng sau nhiều lần giặt. Hướng dẫn bảo quản đồ da, đồ cotton, đồ len một cách khoa học.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-3.jpg', 'active', 1),
(4, 'Bộ Sưu Tập Mới ND Style', 'Giới thiệu bộ sưu tập mới nhất từ ND Style với 50+ mẫu thiết kế độc quyền. Chất liệu cao cấp, form dáng chuẩn, giá cả hợp lý.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-4.jpg', 'active', 1),
(5, 'Phong Cách Thời Trang Công Sở', 'Tạo dáng vẻ chuyên nghiệp với những trang phục phù hợp môi trường làm việc. Gợi ý outfit từ casual đến formal cho nam và nữ.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-5.jpg', 'active', 1),
(6, 'Về Chúng Tôi', 'Câu chuyện thành lập thương hiệu ND Style từ năm 2020. Hành trình 5 năm xây dựng thương hiệu thời trang nội địa được yêu thích.', 'https://res.cloudinary.com/dpz6fwvxl/image/upload/v1759769578/blogs/blog-6.jpg', 'active', 1);

SET FOREIGN_KEY_CHECKS = 1;
