export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type {
  GenderType,
  RoleType,
  User,
  LoginDto,
  SignupDto,
  UpdateProfileDto,
  AuthResponse,
  RefreshTokenResponse,
  AuthContextType,
} from './auth.types';

export type {
  Cart,
  CartItem,
  AddToCartDto,
  UpdateCartItemDto,
  CartContextType,
  CartItemVariant,
} from './cart.types';

export type {
  Order,
  OrderItem,
  OrderStatus,
  CartStatus,
  Address,
  CreateOrderDto,
  OrderFilters,
} from './order.types';

export type {
  Brand,
  Category,
  ProductImage,
  ProductVariant,
  Product,
  Review,
  CreateReviewDto,
  ProductFilterOptions,
  PaymentStatus,
  PaymentMethod,
} from './product.types';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationAction,
  Notification,
  NotificationGroup,
  NotificationFilters,
  NotificationPreferences,
  PaginatedNotifications,
  WebSocketConnectionStatus,
  NotificationContextType,
  SocketEventType,
  SubscribePayload,
  SocketMessage,
  GetNotificationsParams,
  MarkMultipleAsReadRequest,
  DeleteMultipleRequest,
  UnreadCountResponse,
} from './notification.types';
