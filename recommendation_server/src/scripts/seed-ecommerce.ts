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
import { faker } from "@faker-js/faker";
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
      "inventory", "product_images", "product_variants", "products",
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
      { name: "Men's Clothing", subs: ["T-Shirts", "Shirts", "Pants", "Jackets"] },
      { name: "Women's Clothing", subs: ["Dresses", "Tops", "Pants", "Skirts"] },
      { name: "Kids' Clothing", subs: ["Boys", "Girls", "Baby"] },
      { name: "Accessories", subs: ["Bags", "Hats", "Belts", "Jewelry"] },
      { name: "Shoes", subs: ["Sneakers", "Boots", "Sandals", "Formal"] },
    ];

    for (const cat of categoryData) {
      const parent = new Category();
      parent.name = cat.name;
      parent.slug = cat.name.toLowerCase().replace(/\s+/g, "-");
      parent.description = faker.lorem.sentence();
      parent.image_url = faker.image.url();
      parent.is_active = true;
      parent.sort_order = faker.number.int({ min: 0, max: 100 });
      await queryRunner.manager.save(parent);
      categories.push(parent);

      for (const subName of cat.subs) {
        const sub = new Category();
        sub.name = `${cat.name} - ${subName}`;
        sub.slug = `${parent.slug}-${subName.toLowerCase()}`;
        sub.description = faker.lorem.sentence();
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
    const brandNames = ["Nike", "Adidas", "Zara", "H&M", "Uniqlo", "Gucci", "Levi's", "Calvin Klein", "Tommy Hilfiger", "Puma"];
    
    for (const brandName of brandNames) {
      const brand = new Brand();
      brand.name = brandName;
      brand.slug = brandName.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "");
      brand.description = faker.company.buzzPhrase();
      brand.logo_url = faker.image.url();
      brand.website_url = `https://www.${brand.slug}.com`;
      brand.is_active = true;
      await queryRunner.manager.save(brand);
      brands.push(brand);
    }
    console.log(`Created ${brands.length} brands`);

    console.log("Seeding warehouses...");
    const warehouses: Warehouse[] = [];
    const warehouseData = [
      { name: "Main Warehouse", city: "Ho Chi Minh City", is_default: true },
      { name: "North Warehouse", city: "Hanoi", is_default: false },
      { name: "Central Warehouse", city: "Da Nang", is_default: false },
      { name: "South Warehouse", city: "Can Tho", is_default: false },
    ];

    for (const wh of warehouseData) {
      const warehouse = new Warehouse();
      warehouse.name = wh.name;
      warehouse.code = faker.string.alphanumeric(6).toUpperCase();
      warehouse.address = faker.location.streetAddress();
      warehouse.city = wh.city;
      warehouse.country = "Vietnam";
      warehouse.contact_name = faker.person.fullName();
      warehouse.contact_phone = `0${faker.string.numeric(9)}`;
      warehouse.contact_email = faker.internet.email();
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

    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const colors = [
      { name: "Black", code: "#000000" },
      { name: "White", code: "#FFFFFF" },
      { name: "Red", code: "#FF0000" },
      { name: "Blue", code: "#0000FF" },
      { name: "Green", code: "#008000" },
      { name: "Navy", code: "#000080" },
    ];
    const materials = ["Cotton", "Polyester", "Wool", "Silk", "Denim"];

    for (let i = 0; i < CONFIG.categories * CONFIG.productsPerCategory; i++) {
      const category = faker.helpers.arrayElement(categories.filter(c => c.parent_id !== undefined));
      const brand = faker.helpers.arrayElement(brands);
      
      const product = new Product();
      product.name = faker.commerce.productName();
      product.slug = `${faker.helpers.slugify(product.name).toLowerCase()}-${faker.string.alphanumeric(6).toLowerCase()}`;
      product.sku = `SKU-${faker.string.alphanumeric(8).toUpperCase()}`;
      product.description = faker.commerce.productDescription();
      product.short_description = faker.lorem.sentence(10);
      product.base_price = parseFloat(faker.commerce.price({ min: 100000, max: 2000000 }));
      product.compare_at_price = product.base_price * 1.2;
      product.cost_price = product.base_price * 0.6;
      product.weight_kg = faker.number.float({ min: 0.1, max: 2.0 });
      product.is_active = faker.datatype.boolean(0.9);
      product.is_featured = faker.datatype.boolean(0.2);
      product.category = category;
      product.category_id = category.id;
      product.brand = brand;
      product.brand_id = brand.id;
      product.meta_title = product.name;
      product.meta_description = product.short_description;
      await queryRunner.manager.save(product);
      products.push(product);

      const numVariants = faker.number.int({ min: 1, max: CONFIG.variantsPerProduct });
      for (let v = 0; v < numVariants; v++) {
        const variant = new ProductVariant();
        variant.product = product;
        variant.product_id = product.id;
        variant.sku = `${product.sku}-${faker.string.alphanumeric(4).toUpperCase()}`;
        variant.size = faker.helpers.arrayElement(sizes);
        const color = faker.helpers.arrayElement(colors);
        variant.color = color.name;
        variant.color_code = color.code;
        variant.material = faker.helpers.arrayElement(materials);
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
    admin.fullname = "Admin User";
    admin.email = "admin@fashion.com";
    admin.phone_number = "0901234567";
    admin.password = await bcrypt.hash("admin123", 10);
    admin.is_verified = true;
    admin.role = RoleType.ADMIN;
    await queryRunner.manager.save(admin);
    users.push(admin);

    for (let i = 0; i < CONFIG.users; i++) {
      const user = new User();
      user.fullname = faker.person.fullName();
      user.email = faker.internet.email();
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
      const session = faker.helpers.arrayElement(sessions.filter(s => s.user_id === user.id));
      
      const cart = new Cart();
      cart.user = user;
      cart.user_id = user.id;
      cart.session = session;
      cart.session_id = session.id;
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
      order.shipping_address = { street: faker.location.streetAddress(), city: faker.location.city(), country: "Vietnam" };
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
        const orderItem = new OrderItem();
        orderItem.order = order;
        orderItem.order_id = order.id;
        orderItem.variant = variant;
        orderItem.variant_id = variant.id;
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
      history.changed_by = faker.helpers.arrayElement(["system", "admin", user.email]);
      history.notes = `Order ${order.status}`;
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
      review.title = faker.lorem.sentence(5);
      review.content = faker.lorem.paragraphs(2);
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

    console.log("Seeding wishlist items...");
    const wishlistItems: WishlistItem[] = [];
    const wishlistKeys = new Set<string>();

    for (let i = 0; i < CONFIG.wishlistItems; i++) {
      const user = faker.helpers.arrayElement(users.filter(u => u.role === RoleType.USER));
      const variant = faker.helpers.arrayElement(variants);
      const key = `${user.id}-${variant.id}`;
      
      if (wishlistKeys.has(key)) continue;
      wishlistKeys.add(key);
      
      const item = new WishlistItem();
      item.user = user;
      item.user_id = user.id;
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
      promotion.name = `${code} Promotion`;
      promotion.description = faker.lorem.sentence();
      promotion.type = faker.helpers.arrayElement(Object.values(PromotionType));
      promotion.value = promotion.type === PromotionType.PERCENTAGE ? faker.number.int({ min: 5, max: 50 }) : faker.number.int({ min: 10000, max: 100000 });
      promotion.min_order_amount = faker.number.int({ min: 100000, max: 500000 });
      promotion.max_discount_amount = promotion.type === PromotionType.PERCENTAGE ? faker.number.int({ min: 50000, max: 200000 }) : undefined;
      promotion.usage_limit = faker.number.int({ min: 50, max: 500 });
      promotion.usage_limit_per_user = faker.number.int({ min: 1, max: 3 });
      promotion.starts_at = faker.date.past({ years: 1 });
      promotion.ends_at = faker.date.future({ years: 1 });
      promotion.is_active = true;
      promotion.applies_to = faker.helpers.arrayElement(Object.values(PromotionAppliesTo));
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
      
      log.search_query = log.action_type === UserActionType.SEARCH ? faker.commerce.productName() : undefined;
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
      const featureType = faker.helpers.arrayElement(Object.values(ProductFeatureType));
      const featureValue = faker.helpers.arrayElement(["casual", "formal", "sport", "elegant", "summer", "winter", "cotton", "denim"]);
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
