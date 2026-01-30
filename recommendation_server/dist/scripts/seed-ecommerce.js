"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_config_1 = require("../config/database.config");
const category_1 = require("../modules/products/entity/category");
const brand_1 = require("../modules/products/entity/brand");
const product_1 = require("../modules/products/entity/product");
const product_variant_1 = require("../modules/products/entity/product-variant");
const product_image_1 = require("../modules/products/entity/product-image");
const warehouse_1 = require("../modules/inventory/entity/warehouse");
const inventory_1 = require("../modules/inventory/entity/inventory");
const user_entity_1 = require("../modules/users/entity/user.entity");
const user_session_1 = require("../modules/users/entity/user-session");
const cart_1 = require("../modules/cart/entity/cart");
const cart_item_1 = require("../modules/cart/entity/cart-item");
const order_1 = require("../modules/orders/entity/order");
const order_item_1 = require("../modules/orders/entity/order-item");
const order_status_history_1 = require("../modules/orders/entity/order-status-history");
const review_1 = require("../modules/reviews/entity/review");
const review_helpful_1 = require("../modules/reviews/entity/review-helpful");
const wishlist_item_1 = require("../modules/wishlist/entity/wishlist-item");
const promotion_1 = require("../modules/promotions/entity/promotion");
const promotion_usage_1 = require("../modules/promotions/entity/promotion-usage");
const user_behavior_log_1 = require("../modules/ai/entity/user-behavior-log");
const product_feature_1 = require("../modules/ai/entity/product-feature");
const recommendation_cache_1 = require("../modules/ai/entity/recommendation-cache");
const order_enum_1 = require("../modules/orders/enum/order.enum");
const wishlist_enum_1 = require("../modules/wishlist/enum/wishlist.enum");
const promotion_enum_1 = require("../modules/promotions/enum/promotion.enum");
const user_behavior_enum_1 = require("../modules/ai/enum/user-behavior.enum");
const product_feature_enum_1 = require("../modules/ai/enum/product-feature.enum");
const recommendation_enum_1 = require("../modules/ai/enum/recommendation.enum");
const user_session_enum_1 = require("../modules/users/enum/user-session.enum");
const auth_enum_1 = require("../modules/auth/enum/auth.enum");
const cart_enum_1 = require("../modules/cart/enum/cart.enum");
const faker_1 = require("@faker-js/faker");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
    await database_config_1.AppDataSource.initialize();
    console.log("Database connected");
    const queryRunner = database_config_1.AppDataSource.createQueryRunner();
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
        const categories = [];
        const categoryData = [
            { name: "Men's Clothing", subs: ["T-Shirts", "Shirts", "Pants", "Jackets"] },
            { name: "Women's Clothing", subs: ["Dresses", "Tops", "Pants", "Skirts"] },
            { name: "Kids' Clothing", subs: ["Boys", "Girls", "Baby"] },
            { name: "Accessories", subs: ["Bags", "Hats", "Belts", "Jewelry"] },
            { name: "Shoes", subs: ["Sneakers", "Boots", "Sandals", "Formal"] },
        ];
        for (const cat of categoryData) {
            const parent = new category_1.Category();
            parent.name = cat.name;
            parent.slug = cat.name.toLowerCase().replace(/\s+/g, "-");
            parent.description = faker_1.faker.lorem.sentence();
            parent.image_url = faker_1.faker.image.url();
            parent.is_active = true;
            parent.sort_order = faker_1.faker.number.int({ min: 0, max: 100 });
            await queryRunner.manager.save(parent);
            categories.push(parent);
            for (const subName of cat.subs) {
                const sub = new category_1.Category();
                sub.name = `${cat.name} - ${subName}`;
                sub.slug = `${parent.slug}-${subName.toLowerCase()}`;
                sub.description = faker_1.faker.lorem.sentence();
                sub.parent = parent;
                sub.parent_id = parent.id;
                sub.image_url = faker_1.faker.image.url();
                sub.is_active = true;
                sub.sort_order = faker_1.faker.number.int({ min: 0, max: 100 });
                await queryRunner.manager.save(sub);
                categories.push(sub);
            }
        }
        console.log(`Created ${categories.length} categories`);
        console.log("Seeding brands...");
        const brands = [];
        const brandNames = ["Nike", "Adidas", "Zara", "H&M", "Uniqlo", "Gucci", "Levi's", "Calvin Klein", "Tommy Hilfiger", "Puma"];
        for (const brandName of brandNames) {
            const brand = new brand_1.Brand();
            brand.name = brandName;
            brand.slug = brandName.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "");
            brand.description = faker_1.faker.company.buzzPhrase();
            brand.logo_url = faker_1.faker.image.url();
            brand.website_url = `https://www.${brand.slug}.com`;
            brand.is_active = true;
            await queryRunner.manager.save(brand);
            brands.push(brand);
        }
        console.log(`Created ${brands.length} brands`);
        console.log("Seeding warehouses...");
        const warehouses = [];
        const warehouseData = [
            { name: "Main Warehouse", city: "Ho Chi Minh City", is_default: true },
            { name: "North Warehouse", city: "Hanoi", is_default: false },
            { name: "Central Warehouse", city: "Da Nang", is_default: false },
            { name: "South Warehouse", city: "Can Tho", is_default: false },
        ];
        for (const wh of warehouseData) {
            const warehouse = new warehouse_1.Warehouse();
            warehouse.name = wh.name;
            warehouse.code = faker_1.faker.string.alphanumeric(6).toUpperCase();
            warehouse.address = faker_1.faker.location.streetAddress();
            warehouse.city = wh.city;
            warehouse.country = "Vietnam";
            warehouse.contact_name = faker_1.faker.person.fullName();
            warehouse.contact_phone = `0${faker_1.faker.string.numeric(9)}`;
            warehouse.contact_email = faker_1.faker.internet.email();
            warehouse.is_active = true;
            warehouse.is_default = wh.is_default;
            await queryRunner.manager.save(warehouse);
            warehouses.push(warehouse);
        }
        console.log(`Created ${warehouses.length} warehouses`);
        console.log("Seeding products with variants and images...");
        const products = [];
        const variants = [];
        const images = [];
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
            const category = faker_1.faker.helpers.arrayElement(categories.filter(c => c.parent_id !== undefined));
            const brand = faker_1.faker.helpers.arrayElement(brands);
            const product = new product_1.Product();
            product.name = faker_1.faker.commerce.productName();
            product.slug = `${faker_1.faker.helpers.slugify(product.name).toLowerCase()}-${faker_1.faker.string.alphanumeric(6).toLowerCase()}`;
            product.sku = `SKU-${faker_1.faker.string.alphanumeric(8).toUpperCase()}`;
            product.description = faker_1.faker.commerce.productDescription();
            product.short_description = faker_1.faker.lorem.sentence(10);
            product.base_price = parseFloat(faker_1.faker.commerce.price({ min: 100000, max: 2000000 }));
            product.compare_at_price = product.base_price * 1.2;
            product.cost_price = product.base_price * 0.6;
            product.weight_kg = faker_1.faker.number.float({ min: 0.1, max: 2.0 });
            product.is_active = faker_1.faker.datatype.boolean(0.9);
            product.is_featured = faker_1.faker.datatype.boolean(0.2);
            product.category = category;
            product.category_id = category.id;
            product.brand = brand;
            product.brand_id = brand.id;
            product.meta_title = product.name;
            product.meta_description = product.short_description;
            await queryRunner.manager.save(product);
            products.push(product);
            const numVariants = faker_1.faker.number.int({ min: 1, max: CONFIG.variantsPerProduct });
            for (let v = 0; v < numVariants; v++) {
                const variant = new product_variant_1.ProductVariant();
                variant.product = product;
                variant.product_id = product.id;
                variant.sku = `${product.sku}-${faker_1.faker.string.alphanumeric(4).toUpperCase()}`;
                variant.size = faker_1.faker.helpers.arrayElement(sizes);
                const color = faker_1.faker.helpers.arrayElement(colors);
                variant.color = color.name;
                variant.color_code = color.code;
                variant.material = faker_1.faker.helpers.arrayElement(materials);
                variant.price_adjustment = faker_1.faker.number.float({ min: -50000, max: 100000 });
                variant.final_price = product.base_price + variant.price_adjustment;
                variant.weight_kg = product.weight_kg;
                variant.barcode = faker_1.faker.string.numeric(13);
                variant.is_active = true;
                variant.sort_order = v;
                await queryRunner.manager.save(variant);
                variants.push(variant);
                for (const warehouse of warehouses) {
                    const inventory = new inventory_1.Inventory();
                    inventory.variant = variant;
                    inventory.variant_id = variant.id;
                    inventory.warehouse = warehouse;
                    inventory.warehouse_id = warehouse.id;
                    inventory.quantity_available = faker_1.faker.number.int({ min: 0, max: 500 });
                    inventory.quantity_reserved = faker_1.faker.number.int({ min: 0, max: 50 });
                    inventory.quantity_total = inventory.quantity_available + inventory.quantity_reserved;
                    inventory.reorder_level = 10;
                    inventory.reorder_quantity = 100;
                    await queryRunner.manager.save(inventory);
                }
            }
            const numImages = faker_1.faker.number.int({ min: 1, max: CONFIG.imagesPerProduct });
            for (let img = 0; img < numImages; img++) {
                const image = new product_image_1.ProductImage();
                image.product = product;
                image.product_id = product.id;
                image.image_url = faker_1.faker.image.url();
                image.thumbnail_url = faker_1.faker.image.url();
                image.alt_text = product.name;
                image.sort_order = img;
                image.is_primary = img === 0;
                await queryRunner.manager.save(image);
                images.push(image);
            }
        }
        console.log(`Created ${products.length} products, ${variants.length} variants, ${images.length} images`);
        console.log("Seeding users...");
        const users = [];
        const admin = new user_entity_1.User();
        admin.fullname = "Admin User";
        admin.email = "admin@fashion.com";
        admin.phone_number = "0901234567";
        admin.password = await bcryptjs_1.default.hash("admin123", 10);
        admin.is_verified = true;
        admin.role = auth_enum_1.RoleType.ADMIN;
        await queryRunner.manager.save(admin);
        users.push(admin);
        for (let i = 0; i < CONFIG.users; i++) {
            const user = new user_entity_1.User();
            user.fullname = faker_1.faker.person.fullName();
            user.email = faker_1.faker.internet.email();
            user.phone_number = `09${faker_1.faker.string.numeric(8)}`;
            user.password = await bcryptjs_1.default.hash("password123", 10);
            user.address = faker_1.faker.location.streetAddress();
            user.avatar = faker_1.faker.image.avatar();
            user.gender = faker_1.faker.helpers.arrayElement(["male", "female"]);
            user.date_of_birth = faker_1.faker.date.birthdate({ min: 18, max: 65, mode: "age" });
            user.is_verified = faker_1.faker.datatype.boolean(0.8);
            user.role = auth_enum_1.RoleType.USER;
            await queryRunner.manager.save(user);
            users.push(user);
        }
        console.log(`Created ${users.length} users`);
        console.log("Seeding user sessions...");
        const sessions = [];
        for (const user of users) {
            const numSessions = faker_1.faker.number.int({ min: 1, max: 5 });
            for (let s = 0; s < numSessions; s++) {
                const session = new user_session_1.UserSession();
                session.user = user;
                session.user_id = user.id;
                session.session_token = faker_1.faker.string.uuid();
                session.ip_address = faker_1.faker.internet.ip();
                session.user_agent = faker_1.faker.internet.userAgent();
                session.device_type = faker_1.faker.helpers.arrayElement(Object.values(user_session_enum_1.DeviceType));
                session.started_at = faker_1.faker.date.recent({ days: 30 });
                session.is_active = faker_1.faker.datatype.boolean(0.3);
                await queryRunner.manager.save(session);
                sessions.push(session);
            }
        }
        console.log(`Created ${sessions.length} sessions`);
        console.log("Seeding carts...");
        const carts = [];
        const cartItems = [];
        for (let i = 0; i < CONFIG.carts; i++) {
            const user = faker_1.faker.helpers.arrayElement(users.filter(u => u.role === auth_enum_1.RoleType.USER));
            const session = faker_1.faker.helpers.arrayElement(sessions.filter(s => s.user_id === user.id));
            const cart = new cart_1.Cart();
            cart.user = user;
            cart.user_id = user.id;
            cart.session = session;
            cart.session_id = session.id;
            cart.status = faker_1.faker.helpers.arrayElement(Object.values(cart_enum_1.CartStatus));
            cart.total_amount = 0;
            cart.item_count = 0;
            cart.currency = "VND";
            await queryRunner.manager.save(cart);
            carts.push(cart);
            const numItems = faker_1.faker.number.int({ min: 1, max: 5 });
            const usedVariants = new Set();
            for (let ci = 0; ci < numItems; ci++) {
                const availableVariants = variants.filter(v => !usedVariants.has(v.id));
                if (availableVariants.length === 0)
                    break;
                const variant = faker_1.faker.helpers.arrayElement(availableVariants);
                usedVariants.add(variant.id);
                const cartItem = new cart_item_1.CartItem();
                cartItem.cart = cart;
                cartItem.cart_id = cart.id;
                cartItem.variant = variant;
                cartItem.variant_id = variant.id;
                cartItem.quantity = faker_1.faker.number.int({ min: 1, max: 3 });
                cartItem.unit_price = variant.final_price;
                cartItem.total_price = cartItem.unit_price * cartItem.quantity;
                cartItem.added_at = faker_1.faker.date.recent({ days: 7 });
                await queryRunner.manager.save(cartItem);
                cartItems.push(cartItem);
                cart.total_amount = Number(cart.total_amount) + Number(cartItem.total_price);
                cart.item_count = Number(cart.item_count) + Number(cartItem.quantity);
            }
            await queryRunner.manager.save(cart);
        }
        console.log(`Created ${carts.length} carts, ${cartItems.length} cart items`);
        console.log("Seeding orders...");
        const orders = [];
        const orderItems = [];
        const orderHistories = [];
        for (let i = 0; i < CONFIG.orders; i++) {
            const cart = faker_1.faker.helpers.arrayElement(carts);
            const user = cart.user;
            const order = new order_1.Order();
            order.order_number = `ORD-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`;
            order.user = user;
            order.user_id = user.id;
            order.cart = cart;
            order.cart_id = cart?.id;
            order.status = faker_1.faker.helpers.arrayElement(Object.values(order_enum_1.OrderStatus));
            order.payment_status = faker_1.faker.helpers.arrayElement(Object.values(order_enum_1.PaymentStatus));
            order.payment_method = faker_1.faker.helpers.arrayElement(Object.values(order_enum_1.PaymentMethod));
            order.shipping_address = { street: faker_1.faker.location.streetAddress(), city: faker_1.faker.location.city(), country: "Vietnam" };
            order.billing_address = order.shipping_address;
            order.subtotal = 0;
            order.discount_amount = faker_1.faker.number.float({ min: 0, max: 100000 });
            order.shipping_amount = faker_1.faker.number.float({ min: 20000, max: 50000 });
            order.tax_amount = 0;
            order.total_amount = 0;
            order.currency = "VND";
            order.tracking_number = ["shipped", "delivered"].includes(order.status) ? faker_1.faker.string.alphanumeric(12).toUpperCase() : undefined;
            await queryRunner.manager.save(order);
            orders.push(order);
            const numItems = faker_1.faker.number.int({ min: 1, max: 5 });
            for (let oi = 0; oi < numItems; oi++) {
                const variant = faker_1.faker.helpers.arrayElement(variants);
                const orderItem = new order_item_1.OrderItem();
                orderItem.order = order;
                orderItem.order_id = order.id;
                orderItem.variant = variant;
                orderItem.variant_id = variant.id;
                orderItem.product_snapshot = { product_name: variant.product.name, variant_sku: variant.sku };
                orderItem.quantity = faker_1.faker.number.int({ min: 1, max: 3 });
                orderItem.unit_price = variant.final_price;
                orderItem.total_price = orderItem.unit_price * orderItem.quantity;
                orderItem.discount_amount = faker_1.faker.number.float({ min: 0, max: 20000 });
                await queryRunner.manager.save(orderItem);
                orderItems.push(orderItem);
                order.subtotal = Number(order.subtotal) + Number(orderItem.total_price);
            }
            order.tax_amount = Number(order.subtotal) * 0.1;
            order.total_amount = Number(order.subtotal) + Number(order.shipping_amount) + Number(order.tax_amount) - Number(order.discount_amount);
            await queryRunner.manager.save(order);
            const history = new order_status_history_1.OrderStatusHistory();
            history.order = order;
            history.order_id = order.id;
            history.status = order.status;
            history.changed_by = faker_1.faker.helpers.arrayElement(["system", "admin", user.email]);
            history.notes = `Order ${order.status}`;
            await queryRunner.manager.save(history);
            orderHistories.push(history);
        }
        console.log(`Created ${orders.length} orders, ${orderItems.length} order items, ${orderHistories.length} status histories`);
        console.log("Seeding reviews...");
        const reviews = [];
        const reviewHelpful = [];
        for (let i = 0; i < CONFIG.reviews; i++) {
            const orderItem = faker_1.faker.helpers.arrayElement(orderItems);
            const user = orderItem.order.user;
            const review = new review_1.Review();
            review.product = orderItem.variant.product;
            review.product_id = orderItem.variant.product_id;
            review.user = user;
            review.user_id = user.id;
            review.order_item = orderItem;
            review.order_item_id = orderItem.id;
            review.rating = faker_1.faker.number.int({ min: 1, max: 5 });
            review.title = faker_1.faker.lorem.sentence(5);
            review.content = faker_1.faker.lorem.paragraphs(2);
            review.is_verified_purchase = true;
            review.is_approved = faker_1.faker.datatype.boolean(0.8);
            await queryRunner.manager.save(review);
            reviews.push(review);
            const numVotes = faker_1.faker.number.int({ min: 0, max: 10 });
            const usedVoters = new Set();
            for (let v = 0; v < numVotes; v++) {
                const voter = faker_1.faker.helpers.arrayElement(users.filter(u => !usedVoters.has(u.id)));
                if (!voter)
                    break;
                usedVoters.add(voter.id);
                const helpful = new review_helpful_1.ReviewHelpful();
                helpful.review = review;
                helpful.review_id = review.id;
                helpful.user = voter;
                helpful.user_id = voter.id;
                helpful.is_helpful = faker_1.faker.datatype.boolean(0.7);
                await queryRunner.manager.save(helpful);
                reviewHelpful.push(helpful);
                if (helpful.is_helpful) {
                    review.helpful_count++;
                }
                else {
                    review.not_helpful_count++;
                }
            }
            await queryRunner.manager.save(review);
        }
        console.log(`Created ${reviews.length} reviews, ${reviewHelpful.length} helpful votes`);
        console.log("Seeding wishlist items...");
        const wishlistItems = [];
        const wishlistKeys = new Set();
        for (let i = 0; i < CONFIG.wishlistItems; i++) {
            const user = faker_1.faker.helpers.arrayElement(users.filter(u => u.role === auth_enum_1.RoleType.USER));
            const variant = faker_1.faker.helpers.arrayElement(variants);
            const key = `${user.id}-${variant.id}`;
            if (wishlistKeys.has(key))
                continue;
            wishlistKeys.add(key);
            const item = new wishlist_item_1.WishlistItem();
            item.user = user;
            item.user_id = user.id;
            item.variant = variant;
            item.variant_id = variant.id;
            item.priority = faker_1.faker.helpers.arrayElement(Object.values(wishlist_enum_1.WishlistPriority));
            item.added_at = faker_1.faker.date.recent({ days: 30 });
            await queryRunner.manager.save(item);
            wishlistItems.push(item);
        }
        console.log(`Created ${wishlistItems.length} wishlist items`);
        console.log("Seeding promotions...");
        const promotions = [];
        const promotionUsages = [];
        const promoCodes = ["SALE10", "SUMMER20", "WELCOME15", "FLASH25", "VIP30", "NEWUSER10", "FREESHIP", "BUNDLE15", "BIRTHDAY20", "LOYALTY25"];
        for (const code of promoCodes) {
            const promotion = new promotion_1.Promotion();
            promotion.code = code;
            promotion.name = `${code} Promotion`;
            promotion.description = faker_1.faker.lorem.sentence();
            promotion.type = faker_1.faker.helpers.arrayElement(Object.values(promotion_enum_1.PromotionType));
            promotion.value = promotion.type === promotion_enum_1.PromotionType.PERCENTAGE ? faker_1.faker.number.int({ min: 5, max: 50 }) : faker_1.faker.number.int({ min: 10000, max: 100000 });
            promotion.min_order_amount = faker_1.faker.number.int({ min: 100000, max: 500000 });
            promotion.max_discount_amount = promotion.type === promotion_enum_1.PromotionType.PERCENTAGE ? faker_1.faker.number.int({ min: 50000, max: 200000 }) : undefined;
            promotion.usage_limit = faker_1.faker.number.int({ min: 50, max: 500 });
            promotion.usage_limit_per_user = faker_1.faker.number.int({ min: 1, max: 3 });
            promotion.starts_at = faker_1.faker.date.past({ years: 1 });
            promotion.ends_at = faker_1.faker.date.future({ years: 1 });
            promotion.is_active = true;
            promotion.applies_to = faker_1.faker.helpers.arrayElement(Object.values(promotion_enum_1.PromotionAppliesTo));
            await queryRunner.manager.save(promotion);
            promotions.push(promotion);
        }
        const promoUsageKeys = new Set();
        for (let i = 0; i < 50; i++) {
            const order = faker_1.faker.helpers.arrayElement(orders);
            const promotion = faker_1.faker.helpers.arrayElement(promotions);
            const key = `${promotion.id}-${order.id}`;
            if (promoUsageKeys.has(key))
                continue;
            promoUsageKeys.add(key);
            const usage = new promotion_usage_1.PromotionUsage();
            usage.promotion = promotion;
            usage.promotion_id = promotion.id;
            usage.order = order;
            usage.order_id = order.id;
            usage.user = order.user;
            usage.user_id = order.user_id;
            usage.discount_amount = faker_1.faker.number.float({ min: 10000, max: 100000 });
            usage.used_at = order.created_at;
            await queryRunner.manager.save(usage);
            promotionUsages.push(usage);
        }
        console.log(`Created ${promotions.length} promotions, ${promotionUsages.length} usages`);
        console.log("Seeding user behavior logs...");
        const behaviorLogs = [];
        for (let i = 0; i < CONFIG.behaviorLogs; i++) {
            const session = faker_1.faker.helpers.arrayElement(sessions);
            const log = new user_behavior_log_1.UserBehaviorLog();
            log.session = session;
            log.session_id = session.id;
            log.user = session.user;
            log.user_id = session.user_id;
            log.action_type = faker_1.faker.helpers.arrayElement(Object.values(user_behavior_enum_1.UserActionType));
            if (["view", "click", "add_to_cart", "purchase", "wishlist_add"].includes(log.action_type)) {
                const variant = faker_1.faker.helpers.arrayElement(variants);
                log.product = variant.product;
                log.product_id = variant.product_id;
                log.variant = variant;
                log.variant_id = variant.id;
            }
            log.search_query = log.action_type === user_behavior_enum_1.UserActionType.SEARCH ? faker_1.faker.commerce.productName() : undefined;
            log.metadata = { referrer: faker_1.faker.internet.url() };
            log.device_type = session.device_type;
            log.referrer_url = faker_1.faker.internet.url();
            log.page_url = faker_1.faker.internet.url();
            log.ip_address = session.ip_address;
            log.session_duration_seconds = faker_1.faker.number.int({ min: 30, max: 3600 });
            await queryRunner.manager.save(log);
            behaviorLogs.push(log);
        }
        console.log(`Created ${behaviorLogs.length} behavior logs`);
        console.log("Seeding product features...");
        const productFeatures = [];
        const featureKeys = new Set();
        for (let i = 0; i < CONFIG.productFeatures; i++) {
            const product = faker_1.faker.helpers.arrayElement(products);
            const featureType = faker_1.faker.helpers.arrayElement(Object.values(product_feature_enum_1.ProductFeatureType));
            const featureValue = faker_1.faker.helpers.arrayElement(["casual", "formal", "sport", "elegant", "summer", "winter", "cotton", "denim"]);
            const key = `${product.id}-${featureType}-${featureValue}`;
            if (featureKeys.has(key))
                continue;
            featureKeys.add(key);
            const feature = new product_feature_1.ProductFeature();
            feature.product = product;
            feature.product_id = product.id;
            feature.feature_type = featureType;
            feature.feature_value = featureValue;
            feature.confidence_score = faker_1.faker.number.float({ min: 0.7, max: 1.0 });
            feature.source = faker_1.faker.helpers.arrayElement(Object.values(product_feature_enum_1.FeatureSource));
            feature.weight = faker_1.faker.number.int({ min: 1, max: 5 });
            await queryRunner.manager.save(feature);
            productFeatures.push(feature);
        }
        console.log(`Created ${productFeatures.length} product features`);
        console.log("Seeding recommendation cache...");
        const recommendationCaches = [];
        const cacheKeys = new Set();
        for (let i = 0; i < CONFIG.recommendationCaches; i++) {
            const cache = new recommendation_cache_1.RecommendationCache();
            const cacheUser = faker_1.faker.datatype.boolean(0.7) ? faker_1.faker.helpers.arrayElement(users) : undefined;
            const cacheProduct = faker_1.faker.datatype.boolean(0.5) ? faker_1.faker.helpers.arrayElement(products) : undefined;
            const recType = faker_1.faker.helpers.arrayElement(Object.values(recommendation_enum_1.RecommendationType));
            const key = `${cacheUser?.id || 'null'}-${cacheProduct?.id || 'null'}-${recType}`;
            if (cacheKeys.has(key))
                continue;
            cacheKeys.add(key);
            cache.user = cacheUser;
            cache.user_id = cacheUser?.id;
            cache.product = cacheProduct;
            cache.product_id = cacheProduct?.id;
            cache.recommendation_type = recType;
            cache.algorithm = "collaborative_filtering";
            const numRecs = faker_1.faker.number.int({ min: 3, max: 10 });
            cache.recommended_products = [];
            for (let r = 0; r < numRecs; r++) {
                const recProduct = faker_1.faker.helpers.arrayElement(products);
                cache.recommended_products.push({
                    product_id: recProduct.id,
                    score: faker_1.faker.number.float({ min: 0.5, max: 1.0 }),
                    rank: r + 1,
                });
            }
            cache.context_data = { source: "batch_job" };
            cache.expires_at = faker_1.faker.date.future({ years: 1 });
            cache.generated_at = faker_1.faker.date.recent({ days: 1 });
            cache.cache_hit_count = faker_1.faker.number.int({ min: 0, max: 100 });
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
    }
    catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Seeding failed:", error);
        throw error;
    }
    finally {
        await queryRunner.release();
        await database_config_1.AppDataSource.destroy();
    }
}
seedDatabase().catch(console.error);
