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
import { ensureSeedProductAssets, getPreferredProductImageUrl } from "./support/seed-product-image-library";

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

type CategorySeed = {
  name: string;
  subs: string[];
};

type VariantOption = {
  label: string;
  adjustment: number;
};

type CatalogProductSeed = {
  brandName: string;
  model: string;
  priceRange: [number, number];
  weightRange: [number, number];
  variantOptions: VariantOption[];
  colors: Array<{ name: string; code: string }>;
  platforms: string[];
};

const CATEGORY_TREE: CategorySeed[] = [
  { name: "Điện Thoại", subs: ["iPhone", "Samsung Galaxy", "Xiaomi POCO", "Điện Thoại Gaming"] },
  { name: "Laptop", subs: ["MacBook", "Laptop Văn Phòng", "Laptop Gaming", "Laptop AI"] },
  { name: "PC - Màn Hình", subs: ["PC Gaming", "PC Văn Phòng", "Mini PC", "Màn Hình"] },
  { name: "Máy Tính Bảng", subs: ["iPad", "Tablet Android", "Tablet Học Tập", "Tablet Cao Cấp"] },
  { name: "Âm Thanh - Phụ Kiện", subs: ["Tai Nghe", "Loa", "Đồng Hồ Thông Minh", "Sạc - Pin Dự Phòng"] },
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Điện Thoại": "Danh mục điện thoại tập trung vào hàng chính hãng, cấu hình rõ ràng và các dòng máy bán chạy thực tế.",
  "Điện Thoại - iPhone": "Các dòng iPhone mới với tên sản phẩm theo đúng model, dung lượng và nhóm khách hàng dễ nhận biết.",
  "Điện Thoại - Samsung Galaxy": "Các mẫu Samsung Galaxy từ flagship đến cận cao cấp, ưu tiên tên gọi đúng chuẩn thị trường.",
  "Điện Thoại - Xiaomi POCO": "Danh mục Xiaomi, Redmi và POCO với tên model cụ thể, phù hợp nhóm khách cần cấu hình tốt trên giá.",
  "Điện Thoại - Điện Thoại Gaming": "Nhóm điện thoại gaming và hiệu năng cao cho người ưu tiên FPS, tản nhiệt và pin.",
  "Laptop": "Danh mục laptop với dải máy rõ ràng theo nhu cầu học tập, văn phòng, sáng tạo và gaming.",
  "Laptop - MacBook": "MacBook Air và MacBook Pro với tên model, chip và cấu hình giống cách các hệ thống bán lẻ đang dùng.",
  "Laptop - Laptop Văn Phòng": "Laptop mỏng nhẹ, văn phòng và học tập với tên máy cụ thể, không còn kiểu placeholder vô nghĩa.",
  "Laptop - Laptop Gaming": "Laptop gaming với tên model, GPU, CPU và cấu hình đủ để người dùng biết đang xem gì.",
  "Laptop - Laptop AI": "Laptop AI và creator machine có NPU hoặc định hướng AI, sáng tạo nội dung và di động cao.",
  "PC - Màn Hình": "Danh mục PC đồng bộ, mini PC và màn hình theo đúng kiểu đặt tên của hàng công nghệ.",
  "PC - Màn Hình - PC Gaming": "Các cấu hình PC gaming dựng sẵn với CPU, GPU và RAM/SSD rõ ràng ngay từ tên.",
  "PC - Màn Hình - PC Văn Phòng": "PC văn phòng, kế toán, học tập và bán hàng với tên cấu hình thực dụng, dễ đọc.",
  "PC - Màn Hình - Mini PC": "Mini PC nhỏ gọn cho văn phòng hoặc kiosk, tên máy bám sát model đang bán ngoài thị trường.",
  "PC - Màn Hình - Màn Hình": "Màn hình gaming, đồ họa và văn phòng với kích thước, độ phân giải và tần số quét rõ ràng.",
  "Máy Tính Bảng": "Danh mục tablet cho giải trí, học tập và làm việc di động với model cụ thể, tránh seed giả tạo.",
  "Máy Tính Bảng - iPad": "iPad chính hãng với tên gọi theo dòng máy, chip và dung lượng tương tự cách niêm yết ngoài thị trường.",
  "Máy Tính Bảng - Tablet Android": "Tablet Android trung và cao cấp với tên sản phẩm, cấu hình và kết nối rõ ràng.",
  "Máy Tính Bảng - Tablet Học Tập": "Các dòng tablet dễ mua cho học sinh, sinh viên và gia đình, giá mềm nhưng tên sản phẩm vẫn chuẩn.",
  "Máy Tính Bảng - Tablet Cao Cấp": "Tablet cao cấp cho làm việc, vẽ, giải trí và đa nhiệm với model thật, không phải tên placeholder.",
  "Âm Thanh - Phụ Kiện": "Âm thanh và phụ kiện công nghệ được đặt tên theo sản phẩm thực tế để dễ tìm kiếm và quản lý.",
  "Âm Thanh - Phụ Kiện - Tai Nghe": "Tai nghe true wireless, over-ear và headset với đúng brand và model phổ biến.",
  "Âm Thanh - Phụ Kiện - Loa": "Loa bluetooth và loa di động với tên model đang bán trên thị trường, dễ nhận diện phân khúc.",
  "Âm Thanh - Phụ Kiện - Đồng Hồ Thông Minh": "Smartwatch và fitness watch với model rõ ràng, bám sát cách gọi của hãng.",
  "Âm Thanh - Phụ Kiện - Sạc - Pin Dự Phòng": "Sạc nhanh, GaN charger và pin dự phòng với công suất hoặc dung lượng nằm ngay trong tên sản phẩm.",
};

const BRAND_SEEDS = [
  { name: "Apple", description: "Thương hiệu cao cấp với iPhone, MacBook, iPad và hệ sinh thái phần cứng đồng bộ." },
  { name: "Samsung", description: "Dải thiết bị điện thoại, tablet và wearable rộng, nổi bật ở màn hình và tính năng hoàn thiện." },
  { name: "Xiaomi", description: "Thương hiệu mạnh về cấu hình trên giá, trải dài từ smartphone đến tablet và phụ kiện." },
  { name: "POCO", description: "Dòng máy hiệu năng cao trong tầm giá, phù hợp game thủ và nhóm thích cấu hình mạnh." },
  { name: "ASUS", description: "Hãng phần cứng mạnh ở laptop, gaming phone, mini PC và màn hình." },
  { name: "Acer", description: "Thương hiệu phổ biến ở laptop văn phòng, gaming và màn hình cận tầm trung." },
  { name: "Lenovo", description: "Nổi bật ở laptop cân bằng hiệu năng, tablet học tập và các dòng yoga mỏng nhẹ." },
  { name: "HP", description: "Thương hiệu máy tính lâu năm, mạnh ở laptop văn phòng, creator và desktop đồng bộ." },
  { name: "Dell", description: "Máy tính và màn hình hướng đến độ ổn định, phù hợp văn phòng và doanh nghiệp." },
  { name: "MSI", description: "Nổi tiếng với laptop gaming, linh kiện và các mẫu máy thiên hiệu năng." },
  { name: "LG", description: "Màn hình và thiết bị hiển thị thiên về màu sắc, độ sáng và trải nghiệm cân bằng." },
  { name: "ViewSonic", description: "Thương hiệu màn hình với nhiều mẫu gaming và văn phòng giá tốt." },
  { name: "Sony", description: "Âm thanh cá nhân và loa bluetooth nổi bật với tuning tốt và độ hoàn thiện cao." },
  { name: "JBL", description: "Loa và tai nghe thiên giải trí, bass tốt, phù hợp dùng di động và ngoài trời." },
  { name: "Marshall", description: "Thương hiệu âm thanh mang thiết kế đặc trưng, thiên phong cách và trải nghiệm nghe nhạc." },
  { name: "Garmin", description: "Đồng hồ thông minh và đồng hồ thể thao nổi bật ở tracking, pin và độ bền." },
  { name: "Huawei", description: "Thiết bị đeo và tablet với thiết kế cao cấp, pin tốt và nhiều tính năng chăm sóc sức khỏe." },
  { name: "HONOR", description: "Điện thoại và tablet hướng tới cân bằng giữa thiết kế, pin và mức giá." },
  { name: "OPPO", description: "Điện thoại chú trọng camera, thiết kế và trải nghiệm sạc nhanh." },
  { name: "Anker", description: "Phụ kiện sạc và pin dự phòng nổi tiếng ở độ ổn định và công suất thực tế tốt." },
  { name: "Baseus", description: "Phụ kiện công nghệ thiên giá trị sử dụng, đa cổng và phù hợp người dùng di động." },
  { name: "UGREEN", description: "Phụ kiện sạc và kết nối với mức hoàn thiện tốt, phù hợp desktop và mobile." },
  { name: "NOXPC", description: "Dòng máy lắp sẵn nội bộ cho gaming, văn phòng và kiosk với cấu hình minh bạch." },
  { name: "Minisforum", description: "Mini PC mạnh về hiệu năng trên kích thước, phù hợp setup gọn và đa nhiệm." },
  { name: "Beelink", description: "Mini PC nhỏ gọn, thực dụng cho văn phòng, học tập và giải trí tại gia." },
  { name: "Amazfit", description: "Đồng hồ thông minh thiên pin dài, giao diện dễ dùng và giá dễ tiếp cận." },
  { name: "TCL", description: "Tablet và thiết bị phổ thông có mức giá hợp lý cho gia đình và học tập." },
];

const WAREHOUSE_DATA = [
  { name: "Kho điện thoại miền Nam", city: "TP Hồ Chí Minh", is_default: true },
  { name: "Kho laptop miền Bắc", city: "Hà Nội", is_default: false },
  { name: "Kho PC - phụ kiện miền Trung", city: "Đà Nẵng", is_default: false },
  { name: "Trung tâm fulfillment Mekong", city: "Cần Thơ", is_default: false },
];

const APPLE_PHONE_COLORS = [
  { name: "Titan Đen", code: "#1F2937" },
  { name: "Titan Trắng", code: "#E5E7EB" },
  { name: "Titan Tự Nhiên", code: "#C7B8A3" },
  { name: "Titan Xanh", code: "#475569" },
];

const GALAXY_COLORS = [
  { name: "Đen Phantom", code: "#111827" },
  { name: "Xám Titanium", code: "#9CA3AF" },
  { name: "Xanh Navy", code: "#1E3A8A" },
  { name: "Kem", code: "#E5E7EB" },
];

const XIAOMI_COLORS = [
  { name: "Đen", code: "#111827" },
  { name: "Bạc", code: "#CBD5E1" },
  { name: "Tím", code: "#7C3AED" },
  { name: "Xanh Lá", code: "#059669" },
];

const GAMING_COLORS = [
  { name: "Đen RGB", code: "#111827" },
  { name: "Titanium Gray", code: "#6B7280" },
  { name: "Xanh Cyber", code: "#0EA5E9" },
  { name: "Đỏ Đen", code: "#991B1B" },
];

const LAPTOP_COLORS = [
  { name: "Bạc", code: "#CBD5E1" },
  { name: "Xám", code: "#6B7280" },
  { name: "Đen", code: "#111827" },
  { name: "Xanh Midnight", code: "#1E293B" },
];

const AUDIO_COLORS = [
  { name: "Đen", code: "#111827" },
  { name: "Trắng", code: "#F8FAFC" },
  { name: "Xanh Navy", code: "#1D4ED8" },
  { name: "Hồng", code: "#EC4899" },
];

const PRODUCT_HIGHLIGHTS = [
  "màn hình đẹp, độ sáng cao và hiển thị rõ trong nhiều điều kiện",
  "hiệu năng ổn định cho cả tác vụ hằng ngày lẫn nhu cầu nặng hơn",
  "pin bền, sạc nhanh và tối ưu nhiệt tốt khi dùng liên tục",
  "thiết kế hoàn thiện chắc chắn, cảm giác cầm nắm hoặc setup rất gọn",
  "kết nối ổn định, thao tác mượt và trải nghiệm tổng thể cân bằng",
];

const PRODUCT_BENEFITS = [
  "phù hợp để làm máy chính cho học tập, làm việc và giải trí",
  "đáp ứng tốt nhu cầu chơi game, xem phim, xử lý văn bản hoặc đa nhiệm",
  "dễ chọn theo ngân sách vì tên model và cấu hình đã rõ ngay từ đầu",
  "mang lại trải nghiệm ổn định trong nhiều năm sử dụng nếu mua đúng nhu cầu",
  "phù hợp để lên đời thiết bị cũ hoặc mua cho người thân trong gia đình",
];

const PRODUCT_STYLES = [
  "định hướng flagship",
  "tập trung hiệu năng trên giá",
  "tối ưu cho di động và pin",
  "nhắm tới nhóm văn phòng - học tập",
  "thiên gaming và giải trí",
];

const PRODUCT_CATALOG: Record<string, CatalogProductSeed[]> = {
  "iPhone": [
    { brandName: "Apple", model: "iPhone 17", priceRange: [22990000, 25990000], weightRange: [0.17, 0.19], variantOptions: [{ label: "128GB", adjustment: 0 }, { label: "256GB", adjustment: 3000000 }, { label: "512GB", adjustment: 9000000 }], colors: APPLE_PHONE_COLORS, platforms: ["A19", "Super Retina XDR"] },
    { brandName: "Apple", model: "iPhone 17 Air", priceRange: [27990000, 30990000], weightRange: [0.15, 0.17], variantOptions: [{ label: "256GB", adjustment: 0 }, { label: "512GB", adjustment: 5000000 }, { label: "1TB", adjustment: 11000000 }], colors: APPLE_PHONE_COLORS, platforms: ["A19", "Apple Intelligence"] },
    { brandName: "Apple", model: "iPhone 17 Pro", priceRange: [30990000, 34990000], weightRange: [0.18, 0.20], variantOptions: [{ label: "256GB", adjustment: 0 }, { label: "512GB", adjustment: 6000000 }, { label: "1TB", adjustment: 13000000 }], colors: APPLE_PHONE_COLORS, platforms: ["A19 Pro", "120Hz ProMotion"] },
    { brandName: "Apple", model: "iPhone 17 Pro Max", priceRange: [34990000, 38990000], weightRange: [0.21, 0.24], variantOptions: [{ label: "256GB", adjustment: 0 }, { label: "512GB", adjustment: 7000000 }, { label: "1TB", adjustment: 15000000 }], colors: APPLE_PHONE_COLORS, platforms: ["A19 Pro", "Tetraprism Camera"] },
    { brandName: "Apple", model: "iPhone 16e", priceRange: [16990000, 19990000], weightRange: [0.16, 0.18], variantOptions: [{ label: "128GB", adjustment: 0 }, { label: "256GB", adjustment: 2500000 }, { label: "512GB", adjustment: 7000000 }], colors: APPLE_PHONE_COLORS, platforms: ["A18", "OLED"] },
  ],
  "Samsung Galaxy": [
    { brandName: "Samsung", model: "Samsung Galaxy S26", priceRange: [22990000, 25990000], weightRange: [0.17, 0.20], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 3500000 }, { label: "16GB/1TB", adjustment: 10000000 }], colors: GALAXY_COLORS, platforms: ["Snapdragon 8 Elite", "Dynamic AMOLED 2X"] },
    { brandName: "Samsung", model: "Samsung Galaxy S26 Ultra", priceRange: [31990000, 35990000], weightRange: [0.22, 0.24], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 4000000 }, { label: "16GB/1TB", adjustment: 11000000 }], colors: GALAXY_COLORS, platforms: ["Snapdragon 8 Elite", "200MP Camera"] },
    { brandName: "Samsung", model: "Samsung Galaxy Z Fold7", priceRange: [39990000, 44990000], weightRange: [0.23, 0.26], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 5000000 }, { label: "16GB/1TB", adjustment: 13000000 }], colors: GALAXY_COLORS, platforms: ["Foldable AMOLED", "Galaxy AI"] },
    { brandName: "Samsung", model: "Samsung Galaxy Z Flip7", priceRange: [24990000, 28990000], weightRange: [0.18, 0.20], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 3500000 }, { label: "Limited Edition", adjustment: 5000000 }], colors: GALAXY_COLORS, platforms: ["FlexCam", "Galaxy AI"] },
    { brandName: "Samsung", model: "Samsung Galaxy A56 5G", priceRange: [9990000, 11990000], weightRange: [0.18, 0.20], variantOptions: [{ label: "8GB/128GB", adjustment: 0 }, { label: "8GB/256GB", adjustment: 1500000 }, { label: "12GB/256GB", adjustment: 2500000 }], colors: GALAXY_COLORS, platforms: ["Exynos", "120Hz AMOLED"] },
  ],
  "Xiaomi POCO": [
    { brandName: "Xiaomi", model: "Xiaomi 15 Ultra", priceRange: [26990000, 30990000], weightRange: [0.21, 0.23], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "16GB/512GB", adjustment: 3500000 }, { label: "16GB/1TB", adjustment: 8000000 }], colors: XIAOMI_COLORS, platforms: ["Leica Camera", "Snapdragon 8 Elite"] },
    { brandName: "Xiaomi", model: "Xiaomi 15T Pro", priceRange: [15990000, 18990000], weightRange: [0.19, 0.22], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 2500000 }, { label: "16GB/512GB", adjustment: 3500000 }], colors: XIAOMI_COLORS, platforms: ["120W HyperCharge", "144Hz AMOLED"] },
    { brandName: "Xiaomi", model: "Redmi Note 14 Pro+ 5G", priceRange: [8990000, 10990000], weightRange: [0.18, 0.21], variantOptions: [{ label: "8GB/256GB", adjustment: 0 }, { label: "12GB/256GB", adjustment: 1200000 }, { label: "12GB/512GB", adjustment: 2500000 }], colors: XIAOMI_COLORS, platforms: ["200MP Camera", "120W"] },
    { brandName: "POCO", model: "POCO X7 Pro", priceRange: [7990000, 9990000], weightRange: [0.18, 0.21], variantOptions: [{ label: "8GB/256GB", adjustment: 0 }, { label: "12GB/256GB", adjustment: 1000000 }, { label: "12GB/512GB", adjustment: 2500000 }], colors: XIAOMI_COLORS, platforms: ["Dimensity", "1.5K AMOLED"] },
    { brandName: "Xiaomi", model: "Redmi 14C", priceRange: [2990000, 3990000], weightRange: [0.17, 0.20], variantOptions: [{ label: "4GB/128GB", adjustment: 0 }, { label: "6GB/128GB", adjustment: 500000 }, { label: "8GB/256GB", adjustment: 1200000 }], colors: XIAOMI_COLORS, platforms: ["Helio", "90Hz Display"] },
  ],
  "Điện Thoại Gaming": [
    { brandName: "ASUS", model: "ROG Phone 9 Pro", priceRange: [24990000, 29990000], weightRange: [0.22, 0.25], variantOptions: [{ label: "16GB/512GB", adjustment: 0 }, { label: "24GB/1TB", adjustment: 7000000 }, { label: "Fan Bundle", adjustment: 9000000 }], colors: GAMING_COLORS, platforms: ["Snapdragon 8 Elite", "165Hz AMOLED"] },
    { brandName: "POCO", model: "POCO F7 Ultra", priceRange: [12990000, 14990000], weightRange: [0.19, 0.22], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 2000000 }, { label: "16GB/512GB", adjustment: 3500000 }], colors: GAMING_COLORS, platforms: ["Gaming Trigger", "120Hz OLED"] },
    { brandName: "HONOR", model: "HONOR GT Pro", priceRange: [11990000, 13990000], weightRange: [0.18, 0.21], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "16GB/512GB", adjustment: 2500000 }, { label: "16GB/1TB", adjustment: 5000000 }], colors: GAMING_COLORS, platforms: ["VC Cooling", "144Hz"] },
    { brandName: "OPPO", model: "OPPO K13 Turbo", priceRange: [8990000, 10990000], weightRange: [0.18, 0.21], variantOptions: [{ label: "8GB/256GB", adjustment: 0 }, { label: "12GB/256GB", adjustment: 1000000 }, { label: "12GB/512GB", adjustment: 2500000 }], colors: GAMING_COLORS, platforms: ["Turbo Engine", "120Hz AMOLED"] },
  ],
  "MacBook": [
    { brandName: "Apple", model: "MacBook Air M4 13", priceRange: [26990000, 31990000], weightRange: [1.20, 1.30], variantOptions: [{ label: "16GB/256GB", adjustment: 0 }, { label: "16GB/512GB", adjustment: 5000000 }, { label: "24GB/512GB", adjustment: 9000000 }], colors: LAPTOP_COLORS, platforms: ["Apple M4", "Liquid Retina"] },
    { brandName: "Apple", model: "MacBook Air M4 15", priceRange: [31990000, 35990000], weightRange: [1.45, 1.55], variantOptions: [{ label: "16GB/256GB", adjustment: 0 }, { label: "16GB/512GB", adjustment: 5000000 }, { label: "24GB/512GB", adjustment: 9000000 }], colors: LAPTOP_COLORS, platforms: ["Apple M4", "15-inch"] },
    { brandName: "Apple", model: "MacBook Pro M4 14", priceRange: [39990000, 45990000], weightRange: [1.50, 1.70], variantOptions: [{ label: "16GB/512GB", adjustment: 0 }, { label: "24GB/1TB", adjustment: 11000000 }, { label: "36GB/1TB", adjustment: 19000000 }], colors: LAPTOP_COLORS, platforms: ["Apple M4 Pro", "Mini-LED"] },
    { brandName: "Apple", model: "MacBook Pro M4 Max 16", priceRange: [69990000, 79990000], weightRange: [2.00, 2.20], variantOptions: [{ label: "36GB/1TB", adjustment: 0 }, { label: "48GB/1TB", adjustment: 16000000 }, { label: "64GB/2TB", adjustment: 32000000 }], colors: LAPTOP_COLORS, platforms: ["Apple M4 Max", "XDR Display"] },
  ],
  "Laptop Văn Phòng": [
    { brandName: "ASUS", model: "ASUS Vivobook 15 OLED", priceRange: [12990000, 15990000], weightRange: [1.60, 1.80], variantOptions: [{ label: "Core i5/16GB/512GB", adjustment: 0 }, { label: "Core i7/16GB/512GB", adjustment: 2500000 }, { label: "Core i7/16GB/1TB", adjustment: 4500000 }], colors: LAPTOP_COLORS, platforms: ["OLED", "Intel Core"] },
    { brandName: "Acer", model: "Acer Aspire Lite 15", priceRange: [9990000, 12990000], weightRange: [1.60, 1.85], variantOptions: [{ label: "Ryzen 5/16GB/512GB", adjustment: 0 }, { label: "Ryzen 7/16GB/512GB", adjustment: 2200000 }, { label: "Ryzen 7/16GB/1TB", adjustment: 4200000 }], colors: LAPTOP_COLORS, platforms: ["Ryzen", "IPS"] },
    { brandName: "Lenovo", model: "Lenovo IdeaPad Slim 5", priceRange: [13990000, 16990000], weightRange: [1.40, 1.65], variantOptions: [{ label: "Core i5/16GB/512GB", adjustment: 0 }, { label: "Core i7/16GB/512GB", adjustment: 2500000 }, { label: "Core i7/32GB/1TB", adjustment: 6000000 }], colors: LAPTOP_COLORS, platforms: ["WUXGA", "Rapid Charge"] },
    { brandName: "HP", model: "HP Pavilion 14", priceRange: [13990000, 16990000], weightRange: [1.35, 1.55], variantOptions: [{ label: "Core i5/16GB/512GB", adjustment: 0 }, { label: "Core i7/16GB/512GB", adjustment: 2300000 }, { label: "Core i7/32GB/1TB", adjustment: 5800000 }], colors: LAPTOP_COLORS, platforms: ["IPS", "Backlit"] },
    { brandName: "Dell", model: "Dell Inspiron 14", priceRange: [14990000, 17990000], weightRange: [1.40, 1.65], variantOptions: [{ label: "Core 5/16GB/512GB", adjustment: 0 }, { label: "Core 7/16GB/512GB", adjustment: 2500000 }, { label: "Core 7/32GB/1TB", adjustment: 6200000 }], colors: LAPTOP_COLORS, platforms: ["ComfortView", "Wi-Fi 6"] },
  ],
  "Laptop Gaming": [
    { brandName: "ASUS", model: "ASUS TUF Gaming A15", priceRange: [21990000, 25990000], weightRange: [2.10, 2.35], variantOptions: [{ label: "Ryzen 7/RTX 4050", adjustment: 0 }, { label: "Ryzen 7/RTX 4060", adjustment: 4500000 }, { label: "Ryzen 9/RTX 4070", adjustment: 11000000 }], colors: GAMING_COLORS, platforms: ["144Hz", "MUX Switch"] },
    { brandName: "Acer", model: "Acer Nitro V 16", priceRange: [20990000, 24990000], weightRange: [2.20, 2.40], variantOptions: [{ label: "Core i7/RTX 4050", adjustment: 0 }, { label: "Core i7/RTX 4060", adjustment: 4500000 }, { label: "Core i9/RTX 4070", adjustment: 12000000 }], colors: GAMING_COLORS, platforms: ["165Hz", "DLSS"] },
    { brandName: "Lenovo", model: "Lenovo Legion 5", priceRange: [26990000, 31990000], weightRange: [2.25, 2.50], variantOptions: [{ label: "Ryzen 7/RTX 4060", adjustment: 0 }, { label: "Ryzen 7/RTX 4070", adjustment: 6500000 }, { label: "Ryzen 9/RTX 4070", adjustment: 9500000 }], colors: GAMING_COLORS, platforms: ["Legion ColdFront", "WQXGA 165Hz"] },
    { brandName: "HP", model: "HP Victus 16", priceRange: [19990000, 23990000], weightRange: [2.20, 2.45], variantOptions: [{ label: "Ryzen 5/RTX 4050", adjustment: 0 }, { label: "Ryzen 7/RTX 4060", adjustment: 5000000 }, { label: "Core i7/RTX 4060", adjustment: 6000000 }], colors: GAMING_COLORS, platforms: ["OMEN Tempest", "144Hz"] },
    { brandName: "MSI", model: "MSI Katana 15", priceRange: [23990000, 28990000], weightRange: [2.20, 2.45], variantOptions: [{ label: "Core i7/RTX 4060", adjustment: 0 }, { label: "Core i9/RTX 4070", adjustment: 8500000 }, { label: "Core i9/RTX 4080", adjustment: 18000000 }], colors: GAMING_COLORS, platforms: ["Cooler Boost", "QHD 165Hz"] },
  ],
  "Laptop AI": [
    { brandName: "ASUS", model: "ASUS Zenbook S 14", priceRange: [32990000, 37990000], weightRange: [1.20, 1.35], variantOptions: [{ label: "Core Ultra 7/16GB/1TB", adjustment: 0 }, { label: "Core Ultra 9/32GB/1TB", adjustment: 7000000 }, { label: "Core Ultra 9/32GB/2TB", adjustment: 11000000 }], colors: LAPTOP_COLORS, platforms: ["NPU", "OLED 3K"] },
    { brandName: "Lenovo", model: "Lenovo Yoga Pro 7 AI", priceRange: [29990000, 34990000], weightRange: [1.45, 1.60], variantOptions: [{ label: "Ryzen AI 9/16GB/1TB", adjustment: 0 }, { label: "Ryzen AI 9/32GB/1TB", adjustment: 5000000 }, { label: "Ryzen AI 9/32GB/2TB", adjustment: 9500000 }], colors: LAPTOP_COLORS, platforms: ["Ryzen AI", "Creator Mode"] },
    { brandName: "HP", model: "HP OmniBook X", priceRange: [30990000, 35990000], weightRange: [1.30, 1.45], variantOptions: [{ label: "Snapdragon X/16GB/1TB", adjustment: 0 }, { label: "Snapdragon X Elite/16GB/1TB", adjustment: 4500000 }, { label: "Snapdragon X Elite/32GB/1TB", adjustment: 8500000 }], colors: LAPTOP_COLORS, platforms: ["Copilot+ PC", "NPU 45 TOPS"] },
    { brandName: "Acer", model: "Acer Swift Go AI", priceRange: [23990000, 27990000], weightRange: [1.30, 1.50], variantOptions: [{ label: "Core Ultra 5/16GB/512GB", adjustment: 0 }, { label: "Core Ultra 7/16GB/1TB", adjustment: 3500000 }, { label: "Core Ultra 7/32GB/1TB", adjustment: 6500000 }], colors: LAPTOP_COLORS, platforms: ["Intel AI Boost", "OLED"] },
  ],
  "PC Gaming": [
    { brandName: "NOXPC", model: "PC Gaming RTX 4060 Ryzen 7", priceRange: [18990000, 21990000], weightRange: [7.50, 9.50], variantOptions: [{ label: "16GB/1TB", adjustment: 0 }, { label: "32GB/1TB", adjustment: 2500000 }, { label: "32GB/2TB", adjustment: 5000000 }], colors: GAMING_COLORS, platforms: ["RTX 4060", "Ryzen 7"] },
    { brandName: "NOXPC", model: "PC Gaming RTX 4070 Super", priceRange: [30990000, 35990000], weightRange: [8.00, 10.00], variantOptions: [{ label: "32GB/1TB", adjustment: 0 }, { label: "32GB/2TB", adjustment: 3000000 }, { label: "64GB/2TB", adjustment: 6500000 }], colors: GAMING_COLORS, platforms: ["RTX 4070 Super", "Core i7"] },
    { brandName: "NOXPC", model: "PC Gaming RX 7800 XT", priceRange: [27990000, 31990000], weightRange: [8.00, 10.00], variantOptions: [{ label: "32GB/1TB", adjustment: 0 }, { label: "32GB/2TB", adjustment: 2500000 }, { label: "64GB/2TB", adjustment: 6000000 }], colors: GAMING_COLORS, platforms: ["RX 7800 XT", "Ryzen 7"] },
    { brandName: "NOXPC", model: "PC Streaming RTX 4070 Ti", priceRange: [38990000, 43990000], weightRange: [8.50, 10.50], variantOptions: [{ label: "32GB/2TB", adjustment: 0 }, { label: "64GB/2TB", adjustment: 4500000 }, { label: "64GB/4TB", adjustment: 9500000 }], colors: GAMING_COLORS, platforms: ["RTX 4070 Ti", "Core i9"] },
  ],
  "PC Văn Phòng": [
    { brandName: "NOXPC", model: "PC Văn Phòng Intel Core i5 12400", priceRange: [9490000, 11490000], weightRange: [5.50, 7.00], variantOptions: [{ label: "16GB/512GB", adjustment: 0 }, { label: "16GB/1TB", adjustment: 1200000 }, { label: "32GB/1TB", adjustment: 3000000 }], colors: LAPTOP_COLORS, platforms: ["Intel UHD", "Wi-Fi"] },
    { brandName: "NOXPC", model: "PC Kế Toán Ryzen 5 5600G", priceRange: [7990000, 9990000], weightRange: [5.50, 7.00], variantOptions: [{ label: "16GB/512GB", adjustment: 0 }, { label: "16GB/1TB", adjustment: 1000000 }, { label: "32GB/1TB", adjustment: 2800000 }], colors: LAPTOP_COLORS, platforms: ["Radeon Graphics", "Office Ready"] },
    { brandName: "NOXPC", model: "PC All-in-One Intel Core i5", priceRange: [15990000, 18990000], weightRange: [4.50, 6.00], variantOptions: [{ label: "23.8 inch/16GB/512GB", adjustment: 0 }, { label: "23.8 inch/16GB/1TB", adjustment: 1500000 }, { label: "27 inch/32GB/1TB", adjustment: 4500000 }], colors: LAPTOP_COLORS, platforms: ["AIO", "IPS"] },
    { brandName: "NOXPC", model: "PC Bán Hàng Mini Tower", priceRange: [6990000, 8990000], weightRange: [4.50, 6.00], variantOptions: [{ label: "8GB/256GB", adjustment: 0 }, { label: "16GB/512GB", adjustment: 1400000 }, { label: "16GB/1TB", adjustment: 2500000 }], colors: LAPTOP_COLORS, platforms: ["Compact", "LAN Dual"] },
  ],
  "Mini PC": [
    { brandName: "ASUS", model: "ASUS NUC 14 Pro", priceRange: [14990000, 18990000], weightRange: [0.60, 0.90], variantOptions: [{ label: "Core Ultra 5/16GB/512GB", adjustment: 0 }, { label: "Core Ultra 7/16GB/1TB", adjustment: 3500000 }, { label: "Core Ultra 7/32GB/1TB", adjustment: 6500000 }], colors: LAPTOP_COLORS, platforms: ["Intel ARC", "Wi-Fi 7"] },
    { brandName: "Minisforum", model: "Minisforum UM790 Pro", priceRange: [13990000, 17990000], weightRange: [0.70, 1.00], variantOptions: [{ label: "Ryzen 9/32GB/1TB", adjustment: 0 }, { label: "Ryzen 9/32GB/2TB", adjustment: 2500000 }, { label: "Ryzen 9/64GB/2TB", adjustment: 6500000 }], colors: LAPTOP_COLORS, platforms: ["Radeon 780M", "USB4"] },
    { brandName: "Beelink", model: "Beelink SER8", priceRange: [11990000, 14990000], weightRange: [0.65, 0.90], variantOptions: [{ label: "Ryzen 7/32GB/1TB", adjustment: 0 }, { label: "Ryzen 9/32GB/1TB", adjustment: 2500000 }, { label: "Ryzen 9/64GB/2TB", adjustment: 7000000 }], colors: LAPTOP_COLORS, platforms: ["Oculink", "Wi-Fi 6E"] },
    { brandName: "ASUS", model: "ASUS ExpertCenter PN64", priceRange: [8990000, 11990000], weightRange: [0.60, 0.85], variantOptions: [{ label: "Core i5/16GB/512GB", adjustment: 0 }, { label: "Core i7/16GB/1TB", adjustment: 2800000 }, { label: "Core i7/32GB/1TB", adjustment: 5200000 }], colors: LAPTOP_COLORS, platforms: ["Intel Iris Xe", "Dual LAN"] },
  ],
  "Màn Hình": [
    { brandName: "LG", model: "LG UltraGear 27GS95QE", priceRange: [14990000, 17990000], weightRange: [4.50, 6.50], variantOptions: [{ label: "27in/QHD/240Hz", adjustment: 0 }, { label: "27in/OLED/240Hz", adjustment: 4000000 }, { label: "34in/UWQHD/175Hz", adjustment: 9000000 }], colors: LAPTOP_COLORS, platforms: ["OLED", "G-Sync Compatible"] },
    { brandName: "ASUS", model: "ASUS TUF VG27AQL3A", priceRange: [5990000, 7990000], weightRange: [4.00, 6.00], variantOptions: [{ label: "27in/QHD/180Hz", adjustment: 0 }, { label: "27in/QHD/260Hz", adjustment: 1800000 }, { label: "32in/QHD/165Hz", adjustment: 2200000 }], colors: LAPTOP_COLORS, platforms: ["ELMB Sync", "HDR"] },
    { brandName: "Samsung", model: "Samsung Odyssey G5", priceRange: [6490000, 8490000], weightRange: [4.00, 6.00], variantOptions: [{ label: "27in/QHD/165Hz", adjustment: 0 }, { label: "32in/QHD/165Hz", adjustment: 1500000 }, { label: "34in/UWQHD/165Hz", adjustment: 4200000 }], colors: LAPTOP_COLORS, platforms: ["Curved VA", "AMD FreeSync"] },
    { brandName: "Dell", model: "Dell S2722QC", priceRange: [6990000, 8990000], weightRange: [4.00, 6.00], variantOptions: [{ label: "27in/4K/60Hz", adjustment: 0 }, { label: "27in/4K/USB-C", adjustment: 1000000 }, { label: "32in/4K/USB-C", adjustment: 2800000 }], colors: LAPTOP_COLORS, platforms: ["USB-C", "IPS"] },
    { brandName: "ViewSonic", model: "ViewSonic VX2479", priceRange: [3490000, 4590000], weightRange: [3.50, 5.00], variantOptions: [{ label: "24in/FHD/180Hz", adjustment: 0 }, { label: "27in/FHD/180Hz", adjustment: 700000 }, { label: "27in/QHD/165Hz", adjustment: 2200000 }], colors: LAPTOP_COLORS, platforms: ["Fast IPS", "Adaptive Sync"] },
  ],
  "iPad": [
    { brandName: "Apple", model: "iPad Air M3 11", priceRange: [16990000, 20990000], weightRange: [0.45, 0.50], variantOptions: [{ label: "128GB/Wi-Fi", adjustment: 0 }, { label: "256GB/Wi-Fi", adjustment: 2500000 }, { label: "256GB/5G", adjustment: 6000000 }], colors: LAPTOP_COLORS, platforms: ["Apple M3", "Liquid Retina"] },
    { brandName: "Apple", model: "iPad Air M3 13", priceRange: [21990000, 25990000], weightRange: [0.58, 0.65], variantOptions: [{ label: "128GB/Wi-Fi", adjustment: 0 }, { label: "256GB/Wi-Fi", adjustment: 2500000 }, { label: "256GB/5G", adjustment: 6000000 }], colors: LAPTOP_COLORS, platforms: ["Apple M3", "13-inch"] },
    { brandName: "Apple", model: "iPad Pro M4 11", priceRange: [27990000, 32990000], weightRange: [0.44, 0.49], variantOptions: [{ label: "256GB/Wi-Fi", adjustment: 0 }, { label: "512GB/Wi-Fi", adjustment: 4500000 }, { label: "512GB/5G", adjustment: 8500000 }], colors: LAPTOP_COLORS, platforms: ["Apple M4", "Ultra Retina XDR"] },
    { brandName: "Apple", model: "iPad Pro M4 13", priceRange: [36990000, 41990000], weightRange: [0.57, 0.63], variantOptions: [{ label: "256GB/Wi-Fi", adjustment: 0 }, { label: "512GB/Wi-Fi", adjustment: 4500000 }, { label: "1TB/5G", adjustment: 15000000 }], colors: LAPTOP_COLORS, platforms: ["Apple M4", "Tandem OLED"] },
  ],
  "Tablet Android": [
    { brandName: "Samsung", model: "Samsung Galaxy Tab S10+", priceRange: [22990000, 26990000], weightRange: [0.55, 0.70], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 3000000 }, { label: "12GB/5G", adjustment: 5500000 }], colors: GALAXY_COLORS, platforms: ["Dynamic AMOLED 2X", "S Pen"] },
    { brandName: "Xiaomi", model: "Xiaomi Pad 7 Pro", priceRange: [13990000, 16990000], weightRange: [0.50, 0.65], variantOptions: [{ label: "8GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 2800000 }, { label: "12GB/512GB Keyboard", adjustment: 4500000 }], colors: XIAOMI_COLORS, platforms: ["144Hz", "Snapdragon"] },
    { brandName: "HONOR", model: "HONOR Pad 10", priceRange: [9990000, 12990000], weightRange: [0.50, 0.65], variantOptions: [{ label: "8GB/128GB", adjustment: 0 }, { label: "8GB/256GB", adjustment: 1200000 }, { label: "8GB/256GB Keyboard", adjustment: 2800000 }], colors: XIAOMI_COLORS, platforms: ["2.5K Display", "MagicOS"] },
    { brandName: "Lenovo", model: "Lenovo Tab P12", priceRange: [8990000, 11990000], weightRange: [0.55, 0.70], variantOptions: [{ label: "8GB/128GB", adjustment: 0 }, { label: "8GB/256GB", adjustment: 1300000 }, { label: "Bundle Pen", adjustment: 2200000 }], colors: LAPTOP_COLORS, platforms: ["JBL Speakers", "2K"] },
  ],
  "Tablet Học Tập": [
    { brandName: "Samsung", model: "Samsung Galaxy Tab A9+", priceRange: [5290000, 6990000], weightRange: [0.45, 0.60], variantOptions: [{ label: "4GB/64GB", adjustment: 0 }, { label: "8GB/128GB", adjustment: 1200000 }, { label: "5G/8GB/128GB", adjustment: 2600000 }], colors: GALAXY_COLORS, platforms: ["90Hz", "Student Tablet"] },
    { brandName: "Lenovo", model: "Lenovo Tab M11", priceRange: [4290000, 5590000], weightRange: [0.45, 0.60], variantOptions: [{ label: "4GB/128GB", adjustment: 0 }, { label: "8GB/128GB", adjustment: 900000 }, { label: "Pen Bundle", adjustment: 1800000 }], colors: LAPTOP_COLORS, platforms: ["Education", "IPS"] },
    { brandName: "Xiaomi", model: "Redmi Pad SE", priceRange: [3990000, 5290000], weightRange: [0.45, 0.60], variantOptions: [{ label: "4GB/128GB", adjustment: 0 }, { label: "8GB/128GB", adjustment: 800000 }, { label: "8GB/256GB", adjustment: 1600000 }], colors: XIAOMI_COLORS, platforms: ["90Hz", "Quad Speaker"] },
    { brandName: "TCL", model: "TCL NXTPAPER 11", priceRange: [4490000, 5890000], weightRange: [0.45, 0.60], variantOptions: [{ label: "4GB/128GB", adjustment: 0 }, { label: "8GB/128GB", adjustment: 700000 }, { label: "Bundle Pen", adjustment: 1600000 }], colors: LAPTOP_COLORS, platforms: ["Eye Care", "Paper-like"] },
  ],
  "Tablet Cao Cấp": [
    { brandName: "Huawei", model: "Huawei MatePad Pro 13.2", priceRange: [24990000, 28990000], weightRange: [0.55, 0.70], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 3000000 }, { label: "Bundle Keyboard", adjustment: 5000000 }], colors: LAPTOP_COLORS, platforms: ["OLED", "NearLink"] },
    { brandName: "Samsung", model: "Samsung Galaxy Tab S10 Ultra", priceRange: [29990000, 34990000], weightRange: [0.70, 0.85], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 3500000 }, { label: "16GB/1TB", adjustment: 10000000 }], colors: GALAXY_COLORS, platforms: ["AMOLED", "S Pen"] },
    { brandName: "Lenovo", model: "Lenovo Yoga Tab Plus", priceRange: [18990000, 22990000], weightRange: [0.60, 0.75], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "16GB/512GB", adjustment: 2800000 }, { label: "Bundle Keyboard", adjustment: 4800000 }], colors: LAPTOP_COLORS, platforms: ["Creator Tablet", "120Hz"] },
    { brandName: "Xiaomi", model: "Xiaomi Pad 7 Ultra", priceRange: [19990000, 23990000], weightRange: [0.60, 0.75], variantOptions: [{ label: "12GB/256GB", adjustment: 0 }, { label: "12GB/512GB", adjustment: 2600000 }, { label: "16GB/512GB", adjustment: 4200000 }], colors: XIAOMI_COLORS, platforms: ["OLED", "120W"] },
  ],
  "Tai Nghe": [
    { brandName: "Apple", model: "AirPods Pro 2", priceRange: [5490000, 6490000], weightRange: [0.05, 0.08], variantOptions: [{ label: "USB-C", adjustment: 0 }, { label: "MagSafe", adjustment: 300000 }, { label: "Khắc Tên", adjustment: 350000 }], colors: AUDIO_COLORS, platforms: ["ANC", "Spatial Audio"] },
    { brandName: "Sony", model: "Sony WH-1000XM6", priceRange: [8990000, 10990000], weightRange: [0.25, 0.35], variantOptions: [{ label: "Wireless ANC", adjustment: 0 }, { label: "Travel Case", adjustment: 500000 }, { label: "Hi-Res Bundle", adjustment: 900000 }], colors: AUDIO_COLORS, platforms: ["LDAC", "ANC"] },
    { brandName: "Samsung", model: "Samsung Galaxy Buds3 Pro", priceRange: [3990000, 4990000], weightRange: [0.04, 0.06], variantOptions: [{ label: "ANC", adjustment: 0 }, { label: "Wireless Charging", adjustment: 250000 }, { label: "Live Translate", adjustment: 400000 }], colors: AUDIO_COLORS, platforms: ["Seamless Galaxy", "ANC"] },
    { brandName: "JBL", model: "JBL Live Beam 3", priceRange: [3490000, 4490000], weightRange: [0.04, 0.06], variantOptions: [{ label: "ANC", adjustment: 0 }, { label: "Smart Case", adjustment: 350000 }, { label: "Hi-Res", adjustment: 500000 }], colors: AUDIO_COLORS, platforms: ["JBL Signature", "Bluetooth LE"] },
    { brandName: "Marshall", model: "Marshall Major V", priceRange: [3290000, 4290000], weightRange: [0.16, 0.24], variantOptions: [{ label: "Wireless", adjustment: 0 }, { label: "Wireless + Case", adjustment: 250000 }, { label: "Black Edition", adjustment: 300000 }], colors: AUDIO_COLORS, platforms: ["80h Battery", "Custom Button"] },
  ],
  "Loa": [
    { brandName: "JBL", model: "JBL Charge 6", priceRange: [3790000, 4790000], weightRange: [0.90, 1.20], variantOptions: [{ label: "Portable", adjustment: 0 }, { label: "PartyBoost Bundle", adjustment: 300000 }, { label: "Special Color", adjustment: 350000 }], colors: AUDIO_COLORS, platforms: ["Bass Pro", "IP67"] },
    { brandName: "Marshall", model: "Marshall Emberton III", priceRange: [3990000, 4990000], weightRange: [0.60, 0.90], variantOptions: [{ label: "Portable", adjustment: 0 }, { label: "Travel Pack", adjustment: 250000 }, { label: "Cream Edition", adjustment: 300000 }], colors: AUDIO_COLORS, platforms: ["True Stereophonic", "30h Battery"] },
    { brandName: "Sony", model: "Sony ULT Field 3", priceRange: [3490000, 4290000], weightRange: [0.70, 1.00], variantOptions: [{ label: "ULT Bass", adjustment: 0 }, { label: "Strap Bundle", adjustment: 200000 }, { label: "Outdoor Kit", adjustment: 450000 }], colors: AUDIO_COLORS, platforms: ["ULT Mode", "IP67"] },
    { brandName: "Huawei", model: "Huawei Sound Joy 2", priceRange: [2490000, 3290000], weightRange: [0.70, 0.95], variantOptions: [{ label: "Portable", adjustment: 0 }, { label: "Stereo Pair", adjustment: 300000 }, { label: "Travel Pack", adjustment: 450000 }], colors: AUDIO_COLORS, platforms: ["Devialet", "26h Battery"] },
  ],
  "Đồng Hồ Thông Minh": [
    { brandName: "Apple", model: "Apple Watch Series 11", priceRange: [10990000, 13990000], weightRange: [0.03, 0.07], variantOptions: [{ label: "GPS 42mm", adjustment: 0 }, { label: "GPS 46mm", adjustment: 1200000 }, { label: "GPS + Cellular 46mm", adjustment: 3500000 }], colors: AUDIO_COLORS, platforms: ["S11 SiP", "Always-On"] },
    { brandName: "Samsung", model: "Samsung Galaxy Watch8 Classic", priceRange: [8990000, 11990000], weightRange: [0.04, 0.08], variantOptions: [{ label: "Bluetooth 43mm", adjustment: 0 }, { label: "Bluetooth 47mm", adjustment: 1200000 }, { label: "LTE 47mm", adjustment: 2800000 }], colors: AUDIO_COLORS, platforms: ["Wear OS", "BioActive Sensor"] },
    { brandName: "Garmin", model: "Garmin Venu 4", priceRange: [9990000, 12990000], weightRange: [0.04, 0.08], variantOptions: [{ label: "43mm", adjustment: 0 }, { label: "47mm", adjustment: 900000 }, { label: "Music Edition", adjustment: 1400000 }], colors: AUDIO_COLORS, platforms: ["AMOLED", "Health Tracking"] },
    { brandName: "Huawei", model: "Huawei Watch GT 5 Pro", priceRange: [6990000, 9990000], weightRange: [0.04, 0.08], variantOptions: [{ label: "46mm", adjustment: 0 }, { label: "42mm Ceramic", adjustment: 1800000 }, { label: "Golf Edition", adjustment: 2500000 }], colors: AUDIO_COLORS, platforms: ["Dual-band GPS", "14-day Battery"] },
    { brandName: "Amazfit", model: "Amazfit Balance 2", priceRange: [5490000, 7490000], weightRange: [0.04, 0.08], variantOptions: [{ label: "Standard", adjustment: 0 }, { label: "Sport Edition", adjustment: 500000 }, { label: "Premium Strap", adjustment: 800000 }], colors: AUDIO_COLORS, platforms: ["Zepp OS", "Wellness"] },
  ],
  "Sạc - Pin Dự Phòng": [
    { brandName: "Anker", model: "Anker Nano Charger", priceRange: [490000, 790000], weightRange: [0.08, 0.18], variantOptions: [{ label: "30W", adjustment: 0 }, { label: "65W", adjustment: 250000 }, { label: "100W", adjustment: 650000 }], colors: AUDIO_COLORS, platforms: ["GaN", "PowerIQ"] },
    { brandName: "Baseus", model: "Baseus GaN5 Pro", priceRange: [690000, 1090000], weightRange: [0.10, 0.22], variantOptions: [{ label: "65W", adjustment: 0 }, { label: "100W", adjustment: 350000 }, { label: "140W Desktop", adjustment: 900000 }], colors: AUDIO_COLORS, platforms: ["GaN5", "Multi-Port"] },
    { brandName: "UGREEN", model: "UGREEN Nexode", priceRange: [890000, 1290000], weightRange: [0.10, 0.25], variantOptions: [{ label: "65W", adjustment: 0 }, { label: "100W", adjustment: 350000 }, { label: "140W", adjustment: 800000 }], colors: AUDIO_COLORS, platforms: ["GaN", "PD 3.1"] },
    { brandName: "Xiaomi", model: "Xiaomi Power Bank", priceRange: [590000, 990000], weightRange: [0.25, 0.50], variantOptions: [{ label: "10000mAh 33W", adjustment: 0 }, { label: "20000mAh 33W", adjustment: 200000 }, { label: "20000mAh 120W", adjustment: 650000 }], colors: AUDIO_COLORS, platforms: ["Fast Charge", "USB-C"] },
    { brandName: "Samsung", model: "Samsung Travel Adapter", priceRange: [390000, 790000], weightRange: [0.08, 0.18], variantOptions: [{ label: "25W", adjustment: 0 }, { label: "45W", adjustment: 250000 }, { label: "45W Duo", adjustment: 500000 }], colors: AUDIO_COLORS, platforms: ["Super Fast Charging", "USB-C"] },
  ],
  default: [
    { brandName: "NOXPC", model: "Thiết Bị Công Nghệ NOX", priceRange: [2990000, 4990000], weightRange: [0.30, 1.50], variantOptions: [{ label: "Bản Chuẩn", adjustment: 0 }, { label: "Bản Nâng Cấp", adjustment: 500000 }, { label: "Bản Cao Cấp", adjustment: 1500000 }], colors: AUDIO_COLORS, platforms: ["Tech Ready", "Value"] },
  ],
};

const REVIEW_TITLES = [
  "Đúng model, đúng cấu hình như mô tả",
  "Hiệu năng ổn, dùng hằng ngày rất ngon",
  "Giá hợp lý so với trải nghiệm thực tế",
  "Máy đẹp, build ổn và giao hàng nhanh",
  "Pin tốt, màn hình đẹp, đáng tiền",
  "Sẽ quay lại mua thêm cho người thân",
];

const REVIEW_CONTENTS = [
  "Mình đã dùng vài ngày và thấy máy hoạt động ổn định, đúng cấu hình công bố, thao tác mượt và không có cảm giác seed ẩu nữa.",
  "Tên sản phẩm, bộ nhớ và model hiển thị rõ ràng nên rất dễ chọn. Khi nhận hàng đúng như thông tin trên trang và trải nghiệm tổng thể khá tốt.",
  "Sản phẩm phù hợp với nhu cầu học tập, làm việc và giải trí. Hiệu năng đúng kỳ vọng, pin đủ dùng và chất lượng hoàn thiện ổn trong tầm giá.",
  "Đóng gói cẩn thận, giao đúng hẹn, máy đẹp như hình. Mình đánh giá cao việc tên sản phẩm và cấu hình giờ đã rõ ràng, không còn kiểu placeholder linh tinh.",
  "Mình thích cách dữ liệu giờ bám sát hàng công nghệ thật: model cụ thể, cấu hình đọc phát hiểu ngay, rất tiện khi lọc và so sánh sản phẩm.",
];

const FEATURE_VALUES: Record<ProductFeatureType, string[]> = {
  [ProductFeatureType.CATEGORY]: ["flagship", "gaming", "văn phòng", "creator", "học tập", "phụ kiện"],
  [ProductFeatureType.STYLE]: ["premium", "mỏng nhẹ", "hiệu năng cao", "pin bền", "camera đẹp", "gọn bàn làm việc"],
  [ProductFeatureType.OCCASION]: ["làm việc", "học online", "chơi game", "giải trí", "di chuyển nhiều"],
  [ProductFeatureType.SEASON]: ["quanh năm", "mùa tựu trường", "sale giữa năm", "sale cuối năm"],
  [ProductFeatureType.PATTERN]: ["titanium", "matte", "RGB", "viền mỏng", "khung kim loại"],
  [ProductFeatureType.FABRIC_TYPE]: ["OLED", "IPS", "Mini-LED", "Snapdragon", "Apple Silicon", "GaN"],
  [ProductFeatureType.ATTRIBUTE]: ["120Hz", "sạc nhanh", "AI camera", "pin lớn", "Wi-Fi 7", "USB-C"],
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

function getCategoryDescription(name: string): string {
  return CATEGORY_DESCRIPTIONS[name] ?? `Danh mục ${name.toLowerCase()} tập trung vào hàng công nghệ chính hãng với tên model và cấu hình dễ nhận biết.`;
}

function getLeafCategoryName(categoryName: string): string {
  const parts = categoryName.split(" - ");
  return parts[parts.length - 1] ?? categoryName;
}

function buildPlaceholderImageUrl(label: string, width: number, height: number): string {
  const themes = [
    { background: "eff6ff", foreground: "1d4ed8" },
    { background: "f8fafc", foreground: "0f172a" },
    { background: "fef2f2", foreground: "b91c1c" },
    { background: "ecfdf5", foreground: "047857" },
  ];
  const theme = faker.helpers.arrayElement(themes);

  return `https://placehold.co/${width}x${height}/${theme.background}/${theme.foreground}?text=${encodeURIComponent(label.slice(0, 48))}`;
}

function randomMoneyInRange(range: [number, number]): number {
  return faker.number.int({ min: range[0], max: range[1] });
}

function clampCatalogPrice(value: number): number {
  return Math.min(99_000_000, Math.max(100_000, Math.round(value)));
}

function randomWeightInRange(range: [number, number]): number {
  return faker.number.float({ min: range[0], max: range[1], fractionDigits: 3 });
}

const MAX_CART_TOTAL = 95_000_000;
const MAX_ORDER_SUBTOTAL = 85_000_000;

function buildProductCopy(categoryName: string, productSeed: CatalogProductSeed, headlineVariant: VariantOption) {
  const leafCategoryName = getLeafCategoryName(categoryName);
  const highlight = faker.helpers.arrayElement(PRODUCT_HIGHLIGHTS);
  const benefit = faker.helpers.arrayElement(PRODUCT_BENEFITS);
  const style = faker.helpers.arrayElement(PRODUCT_STYLES);
  const platform = faker.helpers.arrayElement(productSeed.platforms);
  const name = `${productSeed.model} ${headlineVariant.label}`.trim();
  const shortDescription = `${platform}, ${highlight}.`;
  const description = `${name} thuộc nhóm ${leafCategoryName.toLowerCase()}, dùng nền tảng ${platform}, nổi bật với ${highlight} và ${benefit}. Tên sản phẩm được seed theo đúng kiểu hàng công nghệ thật để người dùng nhìn vào biết ngay đang xem model nào và cấu hình nào.`;

  return {
    name,
    shortDescription,
    description,
    metaTitle: `${name} | NOX Electronics`,
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
    for (const [parentIndex, cat] of CATEGORY_TREE.entries()) {
      const parent = new Category();
      parent.name = cat.name;
      parent.slug = toSlug(cat.name);
      parent.description = getCategoryDescription(cat.name);
      parent.image_url = buildPlaceholderImageUrl(cat.name, 1200, 800);
      parent.is_active = true;
      parent.sort_order = parentIndex;
      await queryRunner.manager.save(parent);
      categories.push(parent);

      for (const [subIndex, subName] of cat.subs.entries()) {
        const sub = new Category();
        sub.name = `${cat.name} - ${subName}`;
        sub.slug = `${parent.slug}-${toSlug(subName)}`;
        sub.description = getCategoryDescription(sub.name);
        sub.parent = parent;
        sub.parent_id = parent.id;
        sub.image_url = buildPlaceholderImageUrl(subName, 1200, 800);
        sub.is_active = true;
        sub.sort_order = subIndex;
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
      brand.logo_url = buildPlaceholderImageUrl(brandSeed.name, 400, 400);
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
    console.log("Ensuring Cloudinary sample product images...");
    await ensureSeedProductAssets();
    const products: Product[] = [];
    const variants: ProductVariant[] = [];
    const images: ProductImage[] = [];
    const inventoryByVariantId = new Map<number, Inventory[]>();
    const brandByName = new Map(brands.map((brand) => [brand.name, brand]));
    const leafCategories = categories.filter((candidate) => candidate.parent_id !== undefined);

    for (const category of leafCategories) {
      const leafCategoryName = getLeafCategoryName(category.name);
      const catalogEntries = PRODUCT_CATALOG[leafCategoryName] ?? PRODUCT_CATALOG.default;
      const productCombos = faker.helpers.shuffle(
        catalogEntries.flatMap((entry) =>
          entry.variantOptions.map((headlineVariant) => ({
            entry,
            headlineVariant,
          })),
        ),
      );

      for (const combo of productCombos.slice(0, CONFIG.productsPerCategory)) {
        const brand = brandByName.get(combo.entry.brandName);
        if (!brand) {
          throw new Error(`Brand seed not found for ${combo.entry.brandName}`);
        }

        const productCopy = buildProductCopy(category.name, combo.entry, combo.headlineVariant);
        const pricingBase = randomMoneyInRange(combo.entry.priceRange);
        const productBasePrice = clampCatalogPrice(pricingBase + combo.headlineVariant.adjustment);

        const product = new Product();
        product.name = productCopy.name;
        product.slug = `${toSlug(product.name)}-${faker.string.alphanumeric(6).toLowerCase()}`;
        product.sku = `SKU-${faker.string.alphanumeric(8).toUpperCase()}`;
        product.description = productCopy.description;
        product.short_description = productCopy.shortDescription;
        product.base_price = productBasePrice;
        product.compare_at_price = clampCatalogPrice(productBasePrice * faker.number.float({ min: 1.04, max: 1.12, fractionDigits: 2 }));
        product.cost_price = clampCatalogPrice(productBasePrice * faker.number.float({ min: 0.78, max: 0.9, fractionDigits: 2 }));
        product.weight_kg = randomWeightInRange(combo.entry.weightRange);
        product.is_active = faker.datatype.boolean(0.96);
        product.is_featured = faker.datatype.boolean(0.28);
        product.category = category;
        product.category_id = category.id;
        product.brand = brand;
        product.brand_id = brand.id;
        product.meta_title = productCopy.metaTitle;
        product.meta_description = productCopy.metaDescription;
        await queryRunner.manager.save(product);
        products.push(product);

        const variantPool = faker.helpers.shuffle(
          combo.entry.variantOptions.filter((option) => option.label !== combo.headlineVariant.label),
        );
        const numVariants = faker.number.int({ min: 1, max: Math.min(CONFIG.variantsPerProduct, combo.entry.variantOptions.length) });
        const selectedVariantOptions = [combo.headlineVariant, ...variantPool.slice(0, Math.max(0, numVariants - 1))];

        for (const [variantIndex, variantOption] of selectedVariantOptions.entries()) {
          const color = faker.helpers.arrayElement(combo.entry.colors);
          const variant = new ProductVariant();
          variant.product = product;
          variant.product_id = product.id;
          variant.sku = `${product.sku}-${faker.string.alphanumeric(4).toUpperCase()}`;
          variant.size = variantOption.label;
          variant.color = color.name;
          variant.color_code = color.code;
          variant.material = faker.helpers.arrayElement(combo.entry.platforms);
          variant.final_price = clampCatalogPrice(pricingBase + variantOption.adjustment);
          variant.price_adjustment = variant.final_price - product.base_price;
          variant.weight_kg = product.weight_kg;
          variant.barcode = faker.string.numeric(13);
          variant.is_active = true;
          variant.sort_order = variantIndex;
          await queryRunner.manager.save(variant);
          variants.push(variant);

          for (const warehouse of warehouses) {
            const inventory = new Inventory();
            inventory.variant = variant;
            inventory.variant_id = variant.id;
            inventory.warehouse = warehouse;
            inventory.warehouse_id = warehouse.id;
            inventory.quantity_available = faker.number.int({ min: 0, max: 80 });
            inventory.quantity_reserved = faker.number.int({ min: 0, max: 8 });
            inventory.quantity_total = inventory.quantity_available + inventory.quantity_reserved;
            inventory.reorder_level = 5;
            inventory.reorder_quantity = 25;
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
          image.image_url = await getPreferredProductImageUrl(category.name, product.name, img);
          image.thumbnail_url = await getPreferredProductImageUrl(category.name, product.name, img);
          image.alt_text = product.name;
          image.sort_order = img;
          image.is_primary = img === 0;
          await queryRunner.manager.save(image);
          images.push(image);
        }
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

      const numItems = faker.number.int({ min: 1, max: 3 });
      const usedVariants = new Set<number>();
      for (let ci = 0; ci < numItems; ci++) {
        const availableVariants = variants.filter(v => !usedVariants.has(v.id));
        if (availableVariants.length === 0) break;
        const variant = faker.helpers.arrayElement(availableVariants);
        usedVariants.add(variant.id);
        const lineTotal = clampCatalogPrice(Number(variant.final_price));
        if (Number(cart.total_amount) + lineTotal > MAX_CART_TOTAL && Number(cart.item_count) > 0) {
          continue;
        }
        
        const cartItem = new CartItem();
        cartItem.cart = cart;
        cartItem.cart_id = cart.id;
        cartItem.variant = variant;
        cartItem.variant_id = variant.id;
        cartItem.quantity = 1;
        cartItem.unit_price = variant.final_price;
        cartItem.total_price = lineTotal;
        cartItem.added_at = faker.date.recent({ days: 7 });
        await queryRunner.manager.save(cartItem);
        cartItems.push(cartItem);

        cart.total_amount = Number(cart.total_amount) + lineTotal;
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

      const numItems = faker.number.int({ min: 1, max: 3 });
      for (let oi = 0; oi < numItems; oi++) {
        const variant = faker.helpers.arrayElement(variants);
        const inventoryOptions = inventoryByVariantId.get(variant.id) ?? [];
        const inventory = faker.helpers.arrayElement(inventoryOptions);
        const lineTotal = clampCatalogPrice(Number(variant.final_price));
        if (Number(order.subtotal) + lineTotal > MAX_ORDER_SUBTOTAL && Number(order.subtotal) > 0) {
          continue;
        }
        const orderItem = new OrderItem();
        orderItem.order = order;
        orderItem.order_id = order.id;
        orderItem.variant = variant;
        orderItem.variant_id = variant.id;
        orderItem.warehouse_id = inventory?.warehouse_id;
        orderItem.product_snapshot = { product_name: variant.product.name, variant_sku: variant.sku };
        orderItem.quantity = 1;
        orderItem.unit_price = variant.final_price;
        orderItem.total_price = lineTotal;
        orderItem.discount_amount = faker.number.float({ min: 0, max: 20000 });
        await queryRunner.manager.save(orderItem);
        orderItems.push(orderItem);

        order.subtotal = Number(order.subtotal) + lineTotal;
      }
      order.tax_amount = clampCatalogPrice(Number(order.subtotal) * 0.1);
      order.total_amount = clampCatalogPrice(Number(order.subtotal) + Number(order.shipping_amount) + Number(order.tax_amount) - Number(order.discount_amount));
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
