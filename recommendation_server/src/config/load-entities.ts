import { User } from "@/modules/users/entity/user.entity";
import { UserSession } from "@/modules/users/entity/user-session";
import { Category } from "@/modules/products/entity/category";
import { Brand } from "@/modules/products/entity/brand";
import { Product } from "@/modules/products/entity/product";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { ProductImage } from "@/modules/products/entity/product-image";
import { Warehouse } from "@/modules/inventory/entity/warehouse";
import { Inventory } from "@/modules/inventory/entity/inventory";
import { InventoryLog } from "@/modules/inventory/entity/inventory-log";
import { Cart } from "@/modules/cart/entity/cart";
import { CartItem } from "@/modules/cart/entity/cart-item";
import { Order } from "@/modules/orders/entity/order";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { OrderStatusHistory } from "@/modules/orders/entity/order-status-history";
import { Review } from "@/modules/reviews/entity/review";
import { ReviewHelpful } from "@/modules/reviews/entity/review-helpful";
import { WishlistItem } from "@/modules/wishlist/entity/wishlist-item";
import { Promotion } from "@/modules/promotions/entity/promotion";
import { PromotionUsage } from "@/modules/promotions/entity/promotion-usage";
import { UserBehaviorLog } from "@/modules/ai/entity/user-behavior-log";
import { ProductFeature } from "@/modules/ai/entity/product-feature";
import { RecommendationCache } from "@/modules/ai/entity/recommendation-cache";

export const entities = [
  User,
  UserSession,
  Category,
  Brand,
  Product,
  ProductVariant,
  ProductImage,
  Warehouse,
  Inventory,
  InventoryLog,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatusHistory,
  Review,
  ReviewHelpful,
  WishlistItem,
  Promotion,
  PromotionUsage,
  UserBehaviorLog,
  ProductFeature,
  RecommendationCache,
];
