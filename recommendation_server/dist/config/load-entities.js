"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entities = void 0;
const user_entity_1 = require("@/modules/users/entity/user.entity");
const user_session_1 = require("@/modules/users/entity/user-session");
const category_1 = require("@/modules/products/entity/category");
const brand_1 = require("@/modules/products/entity/brand");
const product_1 = require("@/modules/products/entity/product");
const product_variant_1 = require("@/modules/products/entity/product-variant");
const product_image_1 = require("@/modules/products/entity/product-image");
const warehouse_1 = require("@/modules/inventory/entity/warehouse");
const inventory_1 = require("@/modules/inventory/entity/inventory");
const inventory_log_1 = require("@/modules/inventory/entity/inventory-log");
const cart_1 = require("@/modules/cart/entity/cart");
const cart_item_1 = require("@/modules/cart/entity/cart-item");
const order_1 = require("@/modules/orders/entity/order");
const order_item_1 = require("@/modules/orders/entity/order-item");
const order_status_history_1 = require("@/modules/orders/entity/order-status-history");
const review_1 = require("@/modules/reviews/entity/review");
const review_helpful_1 = require("@/modules/reviews/entity/review-helpful");
const wishlist_item_1 = require("@/modules/wishlist/entity/wishlist-item");
const promotion_1 = require("@/modules/promotions/entity/promotion");
const promotion_usage_1 = require("@/modules/promotions/entity/promotion-usage");
const user_behavior_log_1 = require("@/modules/ai/entity/user-behavior-log");
const product_feature_1 = require("@/modules/ai/entity/product-feature");
const recommendation_cache_1 = require("@/modules/ai/entity/recommendation-cache");
exports.entities = [
    user_entity_1.User,
    user_session_1.UserSession,
    category_1.Category,
    brand_1.Brand,
    product_1.Product,
    product_variant_1.ProductVariant,
    product_image_1.ProductImage,
    warehouse_1.Warehouse,
    inventory_1.Inventory,
    inventory_log_1.InventoryLog,
    cart_1.Cart,
    cart_item_1.CartItem,
    order_1.Order,
    order_item_1.OrderItem,
    order_status_history_1.OrderStatusHistory,
    review_1.Review,
    review_helpful_1.ReviewHelpful,
    wishlist_item_1.WishlistItem,
    promotion_1.Promotion,
    promotion_usage_1.PromotionUsage,
    user_behavior_log_1.UserBehaviorLog,
    product_feature_1.ProductFeature,
    recommendation_cache_1.RecommendationCache,
];
