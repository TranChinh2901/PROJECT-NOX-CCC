import { AppDataSource } from "../config/database.config";
import { Category } from "../modules/products/entity/category";
import { Brand } from "../modules/products/entity/brand";
import { Product } from "../modules/products/entity/product";
import { ProductVariant } from "../modules/products/entity/product-variant";
import { ProductImage } from "../modules/products/entity/product-image";
import { Warehouse } from "../modules/inventory/entity/warehouse";
import { Inventory } from "../modules/inventory/entity/inventory";
import { User } from "../modules/users/entity/user.entity";
import { UserSession } from "../modules/users/entity/user-session";
import { Cart } from "../modules/cart/entity/cart";
import { CartItem } from "../modules/cart/entity/cart-item";
import { Order } from "../modules/orders/entity/order";
import { OrderItem } from "../modules/orders/entity/order-item";
import { OrderStatusHistory } from "../modules/orders/entity/order-status-history";
import { Review } from "../modules/reviews/entity/review";
import { ReviewHelpful } from "../modules/reviews/entity/review-helpful";
import { Wishlist } from "../modules/wishlist/entity/wishlist.entity";
import { WishlistItem } from "../modules/wishlist/entity/wishlist-item";
import { Promotion } from "../modules/promotions/entity/promotion";
import { PromotionUsage } from "../modules/promotions/entity/promotion-usage";
import { UserBehaviorLog } from "../modules/ai/entity/user-behavior-log";
import { ProductFeature } from "../modules/ai/entity/product-feature";
import { RecommendationCache } from "../modules/ai/entity/recommendation-cache";
import { OrderStatus, PaymentStatus, PaymentMethod } from "../modules/orders/enum/order.enum";
import { WishlistPriority } from "../modules/wishlist/enum/wishlist.enum";
import { PromotionType, PromotionAppliesTo } from "../modules/promotions/enum/promotion.enum";
import { UserActionType } from "../modules/ai/enum/user-behavior.enum";
import { ProductFeatureType, FeatureSource } from "../modules/ai/enum/product-feature.enum";
import { RecommendationType } from "../modules/ai/enum/recommendation.enum";
import { DeviceType } from "../modules/users/enum/user-session.enum";
import { RoleType } from "../modules/auth/enum/auth.enum";
import { CartStatus } from "../modules/cart/enum/cart.enum";
import { faker } from "@faker-js/faker/locale/vi";
import bcrypt from "bcryptjs";

const CONFIG = {
  categories: 15,
  brands: 20,
  productsPerCategory: 10,
  variantsPerProduct: 3,
  imagesPerProduct: 3,
  warehouses: 4,
  users: 100,
  carts: 50,
  orders: 200,
  reviews: 400,
  wishlistItems: 200,
  promotions: 10,
  behaviorLogs: 1000,
  productFeatures: 500,
  recommendationCaches: 300,
};

const WISHLIST_DEFAULT_NAME = "Danh sách yêu thích";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Thoi Trang Nam": "Danh muc thoi trang nam voi cac mau mac de phoi, phu hop di lam va di choi.",
  "Thoi Trang Nam - Ao Thun": "Ao thun nam uu tien chat lieu thoang mat, de mac hang ngay va linh hoat khi van dong.",
  "Thoi Trang Nam - Ao So Mi": "Ao so mi nam lich su, phu hop moi truong cong so va cac dip gap go quan trong.",
  "Thoi Trang Nam - Quan Dai": "Quan dai nam co phom dang gon gang, de ket hop voi ao thun hoac ao so mi.",
  "Thoi Trang Nam - Ao Khoac": "Ao khoac nam giu am vua du, giup hoan thien set do theo phong cach hien dai.",
  "Thoi Trang Nu": "Danh muc thoi trang nu tap trung vao su mem mai, tinh te va de ung dung moi ngay.",
  "Thoi Trang Nu - Vay Dam": "Vay dam nu ton dang, phu hop di lam, di choi va nhung dip can hinh anh thanh lich.",
  "Thoi Trang Nu - Ao Kieu": "Ao kieu nu nhe nhang, de phoi cung quan tay, chan vay hoac jeans.",
  "Thoi Trang Nu - Quan Nu": "Quan nu co phom dang de mac, huong toi su thoai mai va gon gang trong sinh hoat hang ngay.",
  "Thoi Trang Nu - Chan Vay": "Chan vay nu da dang kieu dang, phu hop ca phong cach nu tinh lan nang dong.",
  "Thoi Trang Tre Em": "Trang phuc cho tre em duoc uu tien su an toan, mem mai va de van dong.",
  "Thoi Trang Tre Em - Be Trai": "Do cho be trai voi mau sac tuoi sang, chat lieu mem va de chuyen dong.",
  "Thoi Trang Tre Em - Be Gai": "Do cho be gai voi thiet ke dang yeu, gon gang va de cham soc.",
  "Thoi Trang Tre Em - So Sinh": "San pham so sinh uu tien vai mem, em diu voi lan da va de thay mac.",
  "Phu Kien": "Phu kien giup hoan thien trang phuc va tang su tien loi trong qua trinh su dung.",
  "Phu Kien - Tui Xach": "Tui xach co thiet ke de ung dung hang ngay, de sap xep do dung can thiet.",
  "Phu Kien - Mu Non": "Mu non giup che nang va tao diem nhan cho tong the trang phuc.",
  "Phu Kien - That Lung": "That lung duoc chon loc theo huong ben dep, de phoi voi nhieu phong cach.",
  "Phu Kien - Trang Suc": "Trang suc tao diem nhan tinh te, phu hop su dung hang ngay va dip dac biet.",
  "Giay Dep": "Danh muc giay dep uu tien su em chan, ben bi va de di chuyen linh hoat.",
  "Giay Dep - Giay The Thao": "Giay the thao co de em va trong luong vua phai, phu hop van dong moi ngay.",
  "Giay Dep - Giay Bot": "Giay bot mang phong cach ca tinh, de ket hop voi nhieu loai trang phuc.",
  "Giay Dep - Dep Sandal": "Dep sandal thoang chan, phu hop di hoc, di choi va du lich ngan ngay.",
  "Giay Dep - Giay Tay": "Giay tay huong toi hinh anh lich su, gon gang cho moi truong cong so.",
};

const BRAND_SEEDS = [
  { name: "YODY", description: "Thuong hieu thoi trang ung dung huong toi su thoai mai va de mac moi ngay." },
  { name: "Canifa", description: "Thuong hieu quen thuoc voi cac dong san pham co ban, de phoi va ben dep." },
  { name: "Routine", description: "Phong cach tre trung, nang dong, tap trung vao nhu cau mac dep hang ngay." },
  { name: "NEM", description: "Thuong hieu thoi trang nu voi ngon ngu thiet ke thanh lich va hien dai." },
  { name: "IVY moda", description: "Dinh huong thoi trang thanh thi, nhan manh vao su gon gang va tinh te." },
  { name: "An Phuoc", description: "Thuong hieu noi bat voi dong san pham cong so va chat lieu duoc chon loc ky." },
  { name: "Owen", description: "Thoi trang nam co tinh ung dung cao, de chon cho nhieu hoan canh su dung." },
  { name: "Biti's Hunter", description: "Dong giay tre trung, linh hoat, phu hop di chuyen va hoat dong hang ngay." },
  { name: "Juno", description: "Phu kien va giay dep nu huong toi su tien dung va tham my can bang." },
  { name: "Marc", description: "Thuong hieu thoi trang nu tre trung voi cac bo suu tap de tiep can va de mac." },
];

const WAREHOUSE_DATA = [
  { name: "Kho trung tâm miền Nam", city: "TP Hồ Chí Minh", is_default: true },
  { name: "Kho khu vực miền Bắc", city: "Hà Nội", is_default: false },
  { name: "Kho khu vực miền Trung", city: "Đà Nẵng", is_default: false },
  { name: "Kho điều phối Tây Nam Bộ", city: "Cần Thơ", is_default: false },
];

const COLOR_OPTIONS = [
  { name: "Đen", code: "#000000" },
  { name: "Trắng", code: "#FFFFFF" },
  { name: "Đỏ", code: "#D62828" },
  { name: "Xanh dương", code: "#2563EB" },
  { name: "Xanh lá", code: "#2E7D32" },
  { name: "Xanh navy", code: "#1E3A8A" },
  { name: "Be", code: "#D6C4A5" },
  { name: "Hồng", code: "#EC4899" },
];

const MATERIALS = ["Cotton", "Polyester", "Linen", "Len mềm", "Lụa", "Denim", "Da tổng hợp"];

const PRODUCT_COLLECTIONS = ["Essential", "Hằng ngày", "Thanh lịch", "Năng động", "Cao cấp", "Trẻ trung"];
const PRODUCT_HIGHLIGHTS = [
  "chất liệu mềm mại, thoáng khí",
  "đường may gọn gàng, dễ bảo quản",
  "phom dáng dễ mặc và dễ phối đồ",
  "màu sắc dễ ứng dụng trong nhiều tình huống",
  "thiết kế gọn nhẹ, tạo cảm giác thoải mái",
];
const PRODUCT_BENEFITS = [
  "phù hợp đi làm, đi học hoặc đi chơi",
  "giữ được sự gọn gàng trong suốt ngày dài",
  "dễ kết hợp với nhiều phụ kiện sẵn có",
  "mang lại cảm giác tự tin khi sử dụng",
  "thuận tiện cho nhu cầu mặc đẹp hằng ngày",
];
const PRODUCT_STYLES = ["phong cách tối giản", "vẻ ngoài thanh lịch", "tinh thần trẻ trung", "đường nét hiện đại", "sự cân bằng giữa tiện dụng và thẩm mỹ"];

const PRODUCT_BASE_NAMES: Record<string, string[]> = {
  "Ao Thun": ["Áo thun cổ tròn", "Áo thun oversize", "Áo thun tay lỡ", "Áo thun polo", "Áo thun phối viền"],
  "Ao So Mi": ["Áo sơ mi dài tay", "Áo sơ mi ngắn tay", "Áo sơ mi slim fit", "Áo sơ mi kẻ sọc", "Áo sơ mi vải mềm"],
  "Quan Dai": ["Quần tây ống đứng", "Quần kaki cơ bản", "Quần jeans suông", "Quần jogger thể thao", "Quần dài co giãn"],
  "Ao Khoac": ["Áo khoác gió nhẹ", "Áo khoác bomber", "Áo khoác denim", "Áo khoác nỉ khóa kéo", "Áo khoác cardigan"],
  "Vay Dam": ["Váy đầm xòe", "Váy đầm suông", "Váy đầm cổ vuông", "Váy đầm ôm nhẹ", "Váy đầm hoa nhí"],
  "Ao Kieu": ["Áo kiểu tay phồng", "Áo kiểu cổ nơ", "Áo kiểu peplum", "Áo kiểu nhún eo", "Áo kiểu cổ vuông"],
  "Quan Nu": ["Quần ống rộng", "Quần culottes", "Quần tây nữ", "Quần jeans lưng cao", "Quần suông mềm"],
  "Chan Vay": ["Chân váy chữ A", "Chân váy xếp ly", "Chân váy jeans", "Chân váy dài midi", "Chân váy bút chì"],
  "Be Trai": ["Bộ thun bé trai", "Áo polo bé trai", "Quần short bé trai", "Áo khoác bé trai", "Bộ mặc nhà bé trai"],
  "Be Gai": ["Đầm bé gái", "Áo kiểu bé gái", "Chân váy bé gái", "Bộ mặc nhà bé gái", "Áo khoác bé gái"],
  "So Sinh": ["Áo liền quần sơ sinh", "Bộ body sơ sinh", "Áo giữ ấm sơ sinh", "Quần sơ sinh mềm", "Khăn quàng cổ sơ sinh"],
  "Tui Xach": ["Túi đeo chéo", "Túi tote", "Túi xách tay", "Túi mini", "Balo thời trang"],
  "Mu Non": ["Mũ lưỡi trai", "Mũ bucket", "Mũ cói", "Mũ len", "Mũ nửa đầu"],
  "That Lung": ["Thắt lưng da", "Thắt lưng khóa kim", "Thắt lưng bản nhỏ", "Thắt lưng casual", "Thắt lưng công sở"],
  "Trang Suc": ["Dây chuyền nhỏ", "Lắc tay thanh mảnh", "Bông tai tròn", "Nhẫn đơn giản", "Set trang sức tối giản"],
  "Giay The Thao": ["Giày thể thao êm chân", "Sneaker cơ bản", "Giày chạy bộ", "Giày tập luyện", "Giày đế mềm"],
  "Giay Bot": ["Giày bốt cổ ngắn", "Giày bốt da mềm", "Bốt đế bằng", "Bốt cổ trung", "Bốt khóa kéo"],
  "Dep Sandal": ["Dép sandal quai ngang", "Dép sandal đế êm", "Dép sandal du lịch", "Dép quai hậu", "Dép sandal tối giản"],
  "Giay Tay": ["Giày tây công sở", "Giày lười da mềm", "Giày oxford", "Giày derby", "Giày tây đế nhẹ"],
  default: ["Sản phẩm thời trang ứng dụng", "Sản phẩm mặc hằng ngày", "Sản phẩm phong cách hiện đại"],
};

const REVIEW_TITLES = [
  "Sản phẩm đúng như mô tả",
  "Mặc lên rất thoải mái",
  "Đáng mua trong tầm giá",
  "Chất liệu ổn, dễ phối đồ",
  "Sẽ mua lại nếu có màu mới",
  "Giao nhanh và đóng gói gọn gàng",
];

const REVIEW_CONTENTS = [
  "Mình đã sử dụng sản phẩm này trong vài ngày và cảm thấy chất vải mềm, mặc dễ chịu, đường may cũng khá chắc chắn.",
  "Màu sắc đúng như hình, kích thước vừa vặn. Mặc đi làm hay đi chơi đều phù hợp và dễ kết hợp phụ kiện.",
  "Giá cả hợp lý so với chất lượng. Sản phẩm lên phom đẹp, không bị gò bó khi mặc cả ngày.",
  "Đóng gói cẩn thận, giao hàng đúng hẹn. Mình đánh giá cao độ hoàn thiện và sự tiện dụng khi sử dụng.",
  "Sản phẩm dễ bảo quản, sau khi giặt vẫn giữ dáng khá tốt. Nếu có thêm nhiều màu nữa sẽ rất hay.",
];

const FEATURE_VALUES: Record<ProductFeatureType, string[]> = {
  [ProductFeatureType.CATEGORY]: ["cơ bản", "ứng dụng", "dễ phối", "đa năng"],
  [ProductFeatureType.STYLE]: ["tối giản", "thanh lịch", "năng động", "trẻ trung", "hiện đại"],
  [ProductFeatureType.OCCASION]: ["đi làm", "đi học", "đi chơi", "du lịch", "sự kiện nhẹ"],
  [ProductFeatureType.SEASON]: ["mùa hè", "mùa thu", "mùa đông", "quanh năm"],
  [ProductFeatureType.PATTERN]: ["trơn màu", "kẻ sọc", "hoa nhỏ", "phối màu"],
  [ProductFeatureType.FABRIC_TYPE]: ["cotton", "linen", "denim", "lụa", "len mềm"],
  [ProductFeatureType.ATTRIBUTE]: ["thoáng khí", "co giãn nhẹ", "dễ giặt", "giữ phom", "êm chân"],
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Chờ xác nhận",
  [OrderStatus.CONFIRMED]: "Đã xác nhận",
  [OrderStatus.PROCESSING]: "Đang xử lý",
  [OrderStatus.SHIPPED]: "Đang giao",
  [OrderStatus.DELIVERED]: "Đã giao",
  [OrderStatus.CANCELLED]: "Đã hủy",
  [OrderStatus.REFUNDED]: "Đã hoàn tiền",
};

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function toAsciiText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function getCategoryDescription(name: string): string {
  return CATEGORY_DESCRIPTIONS[toAsciiText(name)] ?? `Danh mục ${name.toLowerCase()} được chọn lọc theo nhu cầu mặc đẹp và tiện dụng hằng ngày.`;
}

function getLeafCategoryName(categoryName: string): string {
  const parts = categoryName.split(" - ");
  return parts[parts.length - 1] ?? categoryName;
}

function buildProductCopy(categoryName: string) {
  const leafCategoryName = getLeafCategoryName(categoryName);
  const baseNames = PRODUCT_BASE_NAMES[leafCategoryName] ?? PRODUCT_BASE_NAMES.default;
  const baseName = faker.helpers.arrayElement(baseNames);
  const collection = faker.helpers.arrayElement(PRODUCT_COLLECTIONS);
  const highlight = faker.helpers.arrayElement(PRODUCT_HIGHLIGHTS);
  const benefit = faker.helpers.arrayElement(PRODUCT_BENEFITS);
  const style = faker.helpers.arrayElement(PRODUCT_STYLES);
  const name = `${baseName} ${collection}`;
  const shortDescription = `${highlight}, ${benefit}.`;
  const description = `${name} được thiết kế theo ${style}, ưu tiên ${highlight} và ${benefit}. Sản phẩm phù hợp cho nhu cầu mặc đẹp hằng ngày, dễ phối cùng nhiều kiểu trang phục khác nhau.`;

  return {
    name,
    shortDescription,
    description,
    metaTitle: `${name} | Thời trang cho người dùng Việt`,
    metaDescription: shortDescription,
  };
}

function buildPromotionDescription(type: PromotionType, appliesTo: PromotionAppliesTo): string {
  const appliesLabel = appliesTo === PromotionAppliesTo.ALL
    ? "toàn bộ sản phẩm"
    : appliesTo === PromotionAppliesTo.CATEGORIES
      ? "một số danh mục được chọn"
      : "một số sản phẩm cụ thể";

  if (type === PromotionType.FREE_SHIPPING) {
    return `Ưu đãi miễn phí vận chuyển áp dụng cho ${appliesLabel}, giúp tiết kiệm chi phí khi đặt hàng.`;
  }

  if (type === PromotionType.PERCENTAGE) {
    return `Chương trình giảm giá theo phần trăm áp dụng cho ${appliesLabel}, để mua sắm tiết kiệm hơn.`;
  }

  return `Chương trình giảm trực tiếp bằng tiền áp dụng cho ${appliesLabel}, dễ sử dụng ngay tại bước thanh toán.`;
}

async function seedDatabase() {
  console.log("Starting database seeding...");
  
  await AppDataSource.initialize();
  console.log("Database connected");

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log("Clearing existing data...");
    await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0");
    const tables = [
      "recommendation_cache", "product_features", "user_behavior_logs",
      "promotion_usage", "promotions", "wishlist_items", "review_helpful",
      "reviews", "order_status_histories", "order_items", "orders",
      "cart_items", "carts", "user_sessions", "inventory_logs",
      "wishlists", "inventory", "product_images", "product_variants", "products",
      "warehouses", "brands", "categories", "users"
    ];
    for (const table of tables) {
      await queryRunner.query(`TRUNCATE TABLE ${table}`);
    }
    await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Data cleared");

    console.log("Seeding categories...");
    const categories: Category[] = [];
    const categoryData = [
      { name: "Thời Trang Nam", subs: ["Áo Thun", "Áo Sơ Mi", "Quần Dài", "Áo Khoác"] },
      { name: "Thời Trang Nữ", subs: ["Váy Đầm", "Áo Kiều", "Quần Nữ", "Chân Váy"] },
      { name: "Thời Trang Trẻ Em", subs: ["Bé Trai", "Bé Gái", "Sơ Sinh"] },
      { name: "Phụ Kiện", subs: ["Túi Xách", "Mũ Nón", "Thắt Lưng", "Trang Sức"] },
      { name: "Giày Dép", subs: ["Giày Thể Thao", "Giày Bốt", "Dép Sandal", "Giày Tây"] },
    ];

    for (const cat of categoryData) {
      const parent = new Category();
      parent.name = cat.name;
      parent.slug = toSlug(cat.name);
      parent.description = getCategoryDescription(cat.name);
      parent.image_url = faker.image.url();
      parent.is_active = true;
      parent.sort_order = faker.number.int({ min: 0, max: 100 });
      await queryRunner.manager.save(parent);
      categories.push(parent);

      for (const subName of cat.subs) {
        const sub = new Category();
        sub.name = `${cat.name} - ${subName}`;
        sub.slug = `${parent.slug}-${toSlug(subName)}`;
        sub.description = getCategoryDescription(sub.name);
        sub.parent = parent;
        sub.parent_id = parent.id;
        sub.image_url = faker.image.url();
        sub.is_active = true;
        sub.sort_order = faker.number.int({ min: 0, max: 100 });
        await queryRunner.manager.save(sub);
        categories.push(sub);
      }
    }
    console.log(`Created ${categories.length} categories`);

    console.log("Seeding brands...");
    const brands: Brand[] = [];
    
    for (const brandSeed of BRAND_SEEDS) {
      const brand = new Brand();
      brand.name = brandSeed.name;
      brand.slug = toSlug(brandSeed.name);
      brand.description = brandSeed.description;
      brand.logo_url = faker.image.url();
      brand.website_url = `https://www.${brand.slug}.com`;
      brand.is_active = true;
      await queryRunner.manager.save(brand);
      brands.push(brand);
    }
    console.log(`Created ${brands.length} brands`);

    console.log("Seeding warehouses...");
    const warehouses: Warehouse[] = [];

    for (const wh of WAREHOUSE_DATA) {
      const warehouse = new Warehouse();
      warehouse.name = wh.name;
      warehouse.code = faker.string.alphanumeric(6).toUpperCase();
      warehouse.address = faker.location.streetAddress();
      warehouse.city = wh.city;
      warehouse.country = "Việt Nam";
      warehouse.contact_name = faker.person.fullName();
      warehouse.contact_phone = `0${faker.string.numeric(9)}`;
      warehouse.contact_email = `${toSlug(wh.name)}@nox.vn`;
      warehouse.is_active = true;
      warehouse.is_default = wh.is_default;
      await queryRunner.manager.save(warehouse);
      warehouses.push(warehouse);
    }
    console.log(`Created ${warehouses.length} warehouses`);

    console.log("Seeding products with variants and images...");
    const products: Product[] = [];
    const variants: ProductVariant[] = [];
    const images: ProductImage[] = [];
    const inventoryByVariantId = new Map<number, Inventory[]>();

    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

    for (let i = 0; i < CONFIG.categories * CONFIG.productsPerCategory; i++) {
      const category = faker.helpers.arrayElement(categories.filter(c => c.parent_id !== undefined));
      const brand = faker.helpers.arrayElement(brands);
      const productCopy = buildProductCopy(category.name);
      
      const product = new Product();
      product.name = productCopy.name;
      product.slug = `${toSlug(product.name)}-${faker.string.alphanumeric(6).toLowerCase()}`;
      product.sku = `SKU-${faker.string.alphanumeric(8).toUpperCase()}`;
      product.description = productCopy.description;
      product.short_description = productCopy.shortDescription;
      product.base_price = faker.number.int({ min: 100000, max: 2000000 });
      product.compare_at_price = product.base_price * 1.2;
      product.cost_price = product.base_price * 0.6;
      product.weight_kg = faker.number.float({ min: 0.1, max: 2.0 });
      product.is_active = faker.datatype.boolean(0.9);
      product.is_featured = faker.datatype.boolean(0.2);
      product.category = category;
      product.category_id = category.id;
      product.brand = brand;
      product.brand_id = brand.id;
      product.meta_title = productCopy.metaTitle;
      product.meta_description = productCopy.metaDescription;
      await queryRunner.manager.save(product);
      products.push(product);

      const numVariants = faker.number.int({ min: 1, max: CONFIG.variantsPerProduct });
      for (let v = 0; v < numVariants; v++) {
        const variant = new ProductVariant();
        variant.product = product;
        variant.product_id = product.id;
        variant.sku = `${product.sku}-${faker.string.alphanumeric(4).toUpperCase()}`;
        variant.size = faker.helpers.arrayElement(sizes);
        const color = faker.helpers.arrayElement(COLOR_OPTIONS);
        variant.color = color.name;
        variant.color_code = color.code;
        variant.material = faker.helpers.arrayElement(MATERIALS);
        variant.price_adjustment = faker.number.float({ min: -50000, max: 100000 });
        variant.final_price = product.base_price + variant.price_adjustment;
        variant.weight_kg = product.weight_kg;
        variant.barcode = faker.string.numeric(13);
        variant.is_active = true;
        variant.sort_order = v;
        await queryRunner.manager.save(variant);
        variants.push(variant);

        for (const warehouse of warehouses) {
          const inventory = new Inventory();
          inventory.variant = variant;
          inventory.variant_id = variant.id;
          inventory.warehouse = warehouse;
          inventory.warehouse_id = warehouse.id;
          inventory.quantity_available = faker.number.int({ min: 0, max: 500 });
          inventory.quantity_reserved = faker.number.int({ min: 0, max: 50 });
          inventory.quantity_total = inventory.quantity_available + inventory.quantity_reserved;
          inventory.reorder_level = 10;
          inventory.reorder_quantity = 100;
          await queryRunner.manager.save(inventory);
          const existingInventories = inventoryByVariantId.get(variant.id) ?? [];
          existingInventories.push(inventory);
          inventoryByVariantId.set(variant.id, existingInventories);
        }
      }

      const numImages = faker.number.int({ min: 1, max: CONFIG.imagesPerProduct });
      for (let img = 0; img < numImages; img++) {
        const image = new ProductImage();
        image.product = product;
        image.product_id = product.id;
        image.image_url = faker.image.url();
        image.thumbnail_url = faker.image.url();
        image.alt_text = product.name;
        image.sort_order = img;
        image.is_primary = img === 0;
        await queryRunner.manager.save(image);
        images.push(image);
      }
    }
    console.log(`Created ${products.length} products, ${variants.length} variants, ${images.length} images`);

    console.log("Seeding users...");
    const users: User[] = [];
    
    const admin = new User();
    admin.fullname = "Quản trị viên NOX";
    admin.email = "admin@nox.vn";
    admin.phone_number = "0901234567";
    admin.password = await bcrypt.hash("admin123", 10);
    admin.is_verified = true;
    admin.role = RoleType.ADMIN;
    await queryRunner.manager.save(admin);
    users.push(admin);

    for (let i = 0; i < CONFIG.users; i++) {
      const user = new User();
      user.fullname = faker.person.fullName();
      user.email = `khachhang${String(i + 1).padStart(3, "0")}@nox.vn`;
      user.phone_number = `09${faker.string.numeric(8)}`;
      user.password = await bcrypt.hash("password123", 10);
      user.address = faker.location.streetAddress();
      user.avatar = faker.image.avatar();
      user.gender = faker.helpers.arrayElement(["male", "female"] as any);
      user.date_of_birth = faker.date.birthdate({ min: 18, max: 65, mode: "age" });
      user.is_verified = faker.datatype.boolean(0.8);
      user.role = RoleType.USER;
      await queryRunner.manager.save(user);
      users.push(user);
    }
    console.log(`Created ${users.length} users`);

    console.log("Seeding user sessions...");
    const sessions: UserSession[] = [];
    for (const user of users) {
      const numSessions = faker.number.int({ min: 1, max: 5 });
      for (let s = 0; s < numSessions; s++) {
        const session = new UserSession();
        session.user = user;
        session.user_id = user.id;
        session.session_token = faker.string.uuid();
        session.ip_address = faker.internet.ip();
        session.user_agent = faker.internet.userAgent();
        session.device_type = faker.helpers.arrayElement(Object.values(DeviceType));
        session.started_at = faker.date.recent({ days: 30 });
        session.is_active = faker.datatype.boolean(0.3);
        await queryRunner.manager.save(session);
        sessions.push(session);
      }
    }
    console.log(`Created ${sessions.length} sessions`);

    console.log("Seeding carts...");
    const carts: Cart[] = [];
    const cartItems: CartItem[] = [];

    for (let i = 0; i < CONFIG.carts; i++) {
      const user = faker.helpers.arrayElement(users.filter(u => u.role === RoleType.USER));
      
      const cart = new Cart();
      cart.user = user;
      cart.user_id = user.id;
      cart.guest_token = null;
      cart.status = faker.helpers.arrayElement(Object.values(CartStatus));
      cart.total_amount = 0;
      cart.item_count = 0;
      cart.currency = "VND";
      await queryRunner.manager.save(cart);
      carts.push(cart);

      const numItems = faker.number.int({ min: 1, max: 5 });
      const usedVariants = new Set<number>();
      for (let ci = 0; ci < numItems; ci++) {
        const availableVariants = variants.filter(v => !usedVariants.has(v.id));
        if (availableVariants.length === 0) break;
        const variant = faker.helpers.arrayElement(availableVariants);
        usedVariants.add(variant.id);
        
        const cartItem = new CartItem();
        cartItem.cart = cart;
        cartItem.cart_id = cart.id;
        cartItem.variant = variant;
        cartItem.variant_id = variant.id;
        cartItem.quantity = faker.number.int({ min: 1, max: 3 });
        cartItem.unit_price = variant.final_price;
        cartItem.total_price = cartItem.unit_price * cartItem.quantity;
        cartItem.added_at = faker.date.recent({ days: 7 });
        await queryRunner.manager.save(cartItem);
        cartItems.push(cartItem);

        cart.total_amount = Number(cart.total_amount) + Number(cartItem.total_price);
        cart.item_count = Number(cart.item_count) + Number(cartItem.quantity);
      }
      await queryRunner.manager.save(cart);
    }
    console.log(`Created ${carts.length} carts, ${cartItems.length} cart items`);

    console.log("Seeding orders...");
    const orders: Order[] = [];
    const orderItems: OrderItem[] = [];
    const orderHistories: OrderStatusHistory[] = [];

    for (let i = 0; i < CONFIG.orders; i++) {
      const cart = faker.helpers.arrayElement(carts);
      const user = cart.user!;
      
      const order = new Order();
      order.order_number = `ORD-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`;
      order.user = user;
      order.user_id = user.id;
      order.cart = cart;
      order.cart_id = cart?.id;
      order.status = faker.helpers.arrayElement(Object.values(OrderStatus));
      order.payment_status = faker.helpers.arrayElement(Object.values(PaymentStatus));
      order.payment_method = faker.helpers.arrayElement(Object.values(PaymentMethod));
      order.shipping_address = { street: faker.location.streetAddress(), city: faker.location.city(), country: "Việt Nam" };
      order.billing_address = order.shipping_address;
      order.subtotal = 0;
      order.discount_amount = faker.number.float({ min: 0, max: 100000 });
      order.shipping_amount = faker.number.float({ min: 20000, max: 50000 });
      order.tax_amount = 0;
      order.total_amount = 0;
      order.currency = "VND";
      order.tracking_number = ["shipped", "delivered"].includes(order.status) ? faker.string.alphanumeric(12).toUpperCase() : undefined;
      await queryRunner.manager.save(order);
      orders.push(order);

      const numItems = faker.number.int({ min: 1, max: 5 });
      for (let oi = 0; oi < numItems; oi++) {
        const variant = faker.helpers.arrayElement(variants);
        const inventoryOptions = inventoryByVariantId.get(variant.id) ?? [];
        const inventory = faker.helpers.arrayElement(inventoryOptions);
        const orderItem = new OrderItem();
        orderItem.order = order;
        orderItem.order_id = order.id;
        orderItem.variant = variant;
        orderItem.variant_id = variant.id;
        orderItem.warehouse_id = inventory?.warehouse_id;
        orderItem.product_snapshot = { product_name: variant.product.name, variant_sku: variant.sku };
        orderItem.quantity = faker.number.int({ min: 1, max: 3 });
        orderItem.unit_price = variant.final_price;
        orderItem.total_price = orderItem.unit_price * orderItem.quantity;
        orderItem.discount_amount = faker.number.float({ min: 0, max: 20000 });
        await queryRunner.manager.save(orderItem);
        orderItems.push(orderItem);

        order.subtotal = Number(order.subtotal) + Number(orderItem.total_price);
      }
      order.tax_amount = Number(order.subtotal) * 0.1;
      order.total_amount = Number(order.subtotal) + Number(order.shipping_amount) + Number(order.tax_amount) - Number(order.discount_amount);
      await queryRunner.manager.save(order);

      const history = new OrderStatusHistory();
      history.order = order;
      history.order_id = order.id;
      history.status = order.status;
      history.changed_by = faker.helpers.arrayElement(["hệ thống", "quản trị viên", user.email]);
      history.notes = `Đơn hàng ở trạng thái ${ORDER_STATUS_LABELS[order.status]}`;
      await queryRunner.manager.save(history);
      orderHistories.push(history);
    }
    console.log(`Created ${orders.length} orders, ${orderItems.length} order items, ${orderHistories.length} status histories`);

    console.log("Seeding reviews...");
    const reviews: Review[] = [];
    const reviewHelpful: ReviewHelpful[] = [];

    for (let i = 0; i < CONFIG.reviews; i++) {
      const orderItem = faker.helpers.arrayElement(orderItems);
      const user = orderItem.order.user;
      
      const review = new Review();
      review.product = orderItem.variant.product;
      review.product_id = orderItem.variant.product_id;
      review.user = user;
      review.user_id = user.id;
      review.order_item = orderItem;
      review.order_item_id = orderItem.id;
      review.rating = faker.number.int({ min: 1, max: 5 });
      review.title = faker.helpers.arrayElement(REVIEW_TITLES);
      review.content = faker.helpers.arrayElement(REVIEW_CONTENTS);
      review.is_verified_purchase = true;
      review.is_approved = faker.datatype.boolean(0.8);
      await queryRunner.manager.save(review);
      reviews.push(review);

      const numVotes = faker.number.int({ min: 0, max: 10 });
      const usedVoters = new Set<number>();
      for (let v = 0; v < numVotes; v++) {
        const voter = faker.helpers.arrayElement(users.filter(u => !usedVoters.has(u.id)));
        if (!voter) break;
        usedVoters.add(voter.id);
        
        const helpful = new ReviewHelpful();
        helpful.review = review;
        helpful.review_id = review.id;
        helpful.user = voter;
        helpful.user_id = voter.id;
        helpful.is_helpful = faker.datatype.boolean(0.7);
        await queryRunner.manager.save(helpful);
        reviewHelpful.push(helpful);

        if (helpful.is_helpful) {
          review.helpful_count++;
        } else {
          review.not_helpful_count++;
        }
      }
      await queryRunner.manager.save(review);
    }
    console.log(`Created ${reviews.length} reviews, ${reviewHelpful.length} helpful votes`);

    console.log("Seeding wishlists...");
    const wishlists: Wishlist[] = [];
    const defaultWishlistsByUserId = new Map<number, Wishlist>();

    for (const user of users.filter((candidate) => candidate.role === RoleType.USER)) {
      const wishlist = new Wishlist();
      wishlist.user = user;
      wishlist.user_id = user.id;
      wishlist.name = WISHLIST_DEFAULT_NAME;
      wishlist.is_default = true;
      wishlist.is_public = faker.datatype.boolean(0.2);
      wishlist.share_token = wishlist.is_public ? faker.string.alphanumeric(24) : undefined;
      await queryRunner.manager.save(wishlist);
      wishlists.push(wishlist);
      defaultWishlistsByUserId.set(user.id, wishlist);
    }
    console.log(`Created ${wishlists.length} wishlists`);

    console.log("Seeding wishlist items...");
    const wishlistItems: WishlistItem[] = [];
    const wishlistKeys = new Set<string>();

    for (let i = 0; i < CONFIG.wishlistItems; i++) {
      const user = faker.helpers.arrayElement(users.filter(u => u.role === RoleType.USER));
      const variant = faker.helpers.arrayElement(variants);
      const wishlist = defaultWishlistsByUserId.get(user.id);
      if (!wishlist) {
        continue;
      }
      const key = `${wishlist.id}-${variant.id}`;
      
      if (wishlistKeys.has(key)) continue;
      wishlistKeys.add(key);
      
      const item = new WishlistItem();
      item.wishlist = wishlist;
      item.wishlist_id = wishlist.id;
      item.variant = variant;
      item.variant_id = variant.id;
      item.priority = faker.helpers.arrayElement(Object.values(WishlistPriority));
      item.added_at = faker.date.recent({ days: 30 });
      await queryRunner.manager.save(item);
      wishlistItems.push(item);
    }
    console.log(`Created ${wishlistItems.length} wishlist items`);

    console.log("Seeding promotions...");
    const promotions: Promotion[] = [];
    const promotionUsages: PromotionUsage[] = [];

    const promoCodes = ["SALE10", "SUMMER20", "WELCOME15", "FLASH25", "VIP30", "NEWUSER10", "FREESHIP", "BUNDLE15", "BIRTHDAY20", "LOYALTY25"];
    
    for (const code of promoCodes) {
      const promotion = new Promotion();
      promotion.code = code;
      promotion.type = faker.helpers.arrayElement(Object.values(PromotionType));
      promotion.name = `Ưu đãi ${code}`;
      promotion.value = promotion.type === PromotionType.PERCENTAGE ? faker.number.int({ min: 5, max: 50 }) : faker.number.int({ min: 10000, max: 100000 });
      promotion.min_order_amount = faker.number.int({ min: 100000, max: 500000 });
      promotion.max_discount_amount = promotion.type === PromotionType.PERCENTAGE ? faker.number.int({ min: 50000, max: 200000 }) : undefined;
      promotion.usage_limit = faker.number.int({ min: 50, max: 500 });
      promotion.usage_limit_per_user = faker.number.int({ min: 1, max: 3 });
      promotion.starts_at = faker.date.past({ years: 1 });
      promotion.ends_at = faker.date.future({ years: 1 });
      promotion.is_active = true;
      promotion.applies_to = faker.helpers.arrayElement(Object.values(PromotionAppliesTo));
      promotion.description = buildPromotionDescription(promotion.type, promotion.applies_to);
      await queryRunner.manager.save(promotion);
      promotions.push(promotion);
    }

    const promoUsageKeys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const order = faker.helpers.arrayElement(orders);
      const promotion = faker.helpers.arrayElement(promotions);
      const key = `${promotion.id}-${order.id}`;
      
      if (promoUsageKeys.has(key)) continue;
      promoUsageKeys.add(key);
      
      const usage = new PromotionUsage();
      usage.promotion = promotion;
      usage.promotion_id = promotion.id;
      usage.order = order;
      usage.order_id = order.id;
      usage.user = order.user;
      usage.user_id = order.user_id;
      usage.discount_amount = faker.number.float({ min: 10000, max: 100000 });
      usage.used_at = order.created_at;
      await queryRunner.manager.save(usage);
      promotionUsages.push(usage);
    }
    console.log(`Created ${promotions.length} promotions, ${promotionUsages.length} usages`);

    console.log("Seeding user behavior logs...");
    const behaviorLogs: UserBehaviorLog[] = [];

    for (let i = 0; i < CONFIG.behaviorLogs; i++) {
      const session = faker.helpers.arrayElement(sessions);
      const log = new UserBehaviorLog();
      log.session = session;
      log.session_id = session.id;
      log.user = session.user;
      log.user_id = session.user_id;
      log.action_type = faker.helpers.arrayElement(Object.values(UserActionType));
      
      if (["view", "click", "add_to_cart", "purchase", "wishlist_add"].includes(log.action_type)) {
        const variant = faker.helpers.arrayElement(variants);
        log.product = variant.product;
        log.product_id = variant.product_id;
        log.variant = variant;
        log.variant_id = variant.id;
      }
      
      log.search_query = log.action_type === UserActionType.SEARCH ? faker.helpers.arrayElement(products).name : undefined;
      log.metadata = { referrer: faker.internet.url() };
      log.device_type = session.device_type;
      log.referrer_url = faker.internet.url();
      log.page_url = faker.internet.url();
      log.ip_address = session.ip_address;
      log.session_duration_seconds = faker.number.int({ min: 30, max: 3600 });
      await queryRunner.manager.save(log);
      behaviorLogs.push(log);
    }
    console.log(`Created ${behaviorLogs.length} behavior logs`);

    console.log("Seeding product features...");
    const productFeatures: ProductFeature[] = [];
    const featureKeys = new Set<string>();

    for (let i = 0; i < CONFIG.productFeatures; i++) {
      const product = faker.helpers.arrayElement(products);
      const featureType = faker.helpers.arrayElement(Object.values(ProductFeatureType)) as ProductFeatureType;
      const featureValue = faker.helpers.arrayElement(FEATURE_VALUES[featureType]);
      const key = `${product.id}-${featureType}-${featureValue}`;
      
      if (featureKeys.has(key)) continue;
      featureKeys.add(key);
      
      const feature = new ProductFeature();
      feature.product = product;
      feature.product_id = product.id;
      feature.feature_type = featureType;
      feature.feature_value = featureValue;
      feature.confidence_score = faker.number.float({ min: 0.7, max: 1.0 });
      feature.source = faker.helpers.arrayElement(Object.values(FeatureSource));
      feature.weight = faker.number.int({ min: 1, max: 5 });
      await queryRunner.manager.save(feature);
      productFeatures.push(feature);
    }
    console.log(`Created ${productFeatures.length} product features`);

    console.log("Seeding recommendation cache...");
    const recommendationCaches: RecommendationCache[] = [];
    const cacheKeys = new Set<string>();

    for (let i = 0; i < CONFIG.recommendationCaches; i++) {
      const cache = new RecommendationCache();
      const cacheUser = faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(users) : undefined;
      const cacheProduct = faker.datatype.boolean(0.5) ? faker.helpers.arrayElement(products) : undefined;
      const recType = faker.helpers.arrayElement(Object.values(RecommendationType));
      const key = `${cacheUser?.id || 'null'}-${cacheProduct?.id || 'null'}-${recType}`;
      
      if (cacheKeys.has(key)) continue;
      cacheKeys.add(key);
      
      cache.user = cacheUser;
      cache.user_id = cacheUser?.id;
      cache.product = cacheProduct;
      cache.product_id = cacheProduct?.id;
      cache.cache_key = `user:${cache.user_id ?? 'guest'}:product:${cache.product_id ?? 'none'}:type:${recType}:algo:collaborative_filtering`;
      cache.recommendation_type = recType;
      cache.algorithm = "collaborative_filtering";
      
      const numRecs = faker.number.int({ min: 3, max: 10 });
      cache.recommended_products = [];
      for (let r = 0; r < numRecs; r++) {
        const recProduct = faker.helpers.arrayElement(products);
        cache.recommended_products.push({
          product_id: recProduct.id,
          score: faker.number.float({ min: 0.5, max: 1.0 }),
          rank: r + 1,
        });
      }
      
      cache.context_data = { source: "batch_job" };
      cache.expires_at = faker.date.future({ years: 1 });
      cache.generated_at = faker.date.recent({ days: 1 });
      cache.cache_hit_count = faker.number.int({ min: 0, max: 100 });
      cache.is_active = true;
      await queryRunner.manager.save(cache);
      recommendationCaches.push(cache);
    }
    console.log(`Created ${recommendationCaches.length} recommendation caches`);

    await queryRunner.commitTransaction();
    console.log("\nDATABASE SEEDING COMPLETE!\n");
    console.log("Summary:");
    console.log(`- ${categories.length} categories`);
    console.log(`- ${brands.length} brands`);
    console.log(`- ${products.length} products`);
    console.log(`- ${variants.length} product variants`);
    console.log(`- ${images.length} product images`);
    console.log(`- ${warehouses.length} warehouses`);
    console.log(`- ${users.length} users`);
    console.log(`- ${sessions.length} sessions`);
    console.log(`- ${carts.length} carts`);
    console.log(`- ${orders.length} orders`);
    console.log(`- ${reviews.length} reviews`);
    console.log(`- ${wishlistItems.length} wishlist items`);
    console.log(`- ${promotions.length} promotions`);
    console.log(`- ${behaviorLogs.length} behavior logs`);
    console.log(`- ${productFeatures.length} product features`);
    console.log(`- ${recommendationCaches.length} recommendation caches`);
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seedDatabase().catch(console.error);
