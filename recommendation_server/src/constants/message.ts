export const SuccessMessages = {
  AUTH: {
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    REGISTER_SUCCESS: "Regiter successful",
    TOKEN_REFRESHED: "Token refresh successful",
    PASSWORD_CHANGED: "Password changed",
    PASSWORD_RESET: "Password reset",
    EMAIL_VERIFIED: "Email verified",
  },
  PROFILE: {
    PROFILE_FETCHED: "Profile fetched successfully",
    PROFILE_UPDATED: "Profile updated successfully"
  },

  USER: {
    USER_CREATED: "User created",
    USER_UPDATED: "User updated",
    USER_DELETED: "User deleted",
    USER_GET: "User fetched",
    USER_LIST_GET: "User list fetched",
    USER_ACTIVATED: "User activated",
    USER_DEACTIVATED: "User deactivated",
    USER_ROLE_UPDATED: "User role updated",
    AVATAR_UPLOADED: "Avatar uploaded successfully"
  },

  PRODUCT: {
    PRODUCT_CREATED: "Product created",
    PRODUCT_UPDATED: "Product updated",
    PRODUCT_DELETED: "Product deleted",
    PRODUCT_GET: "Product fetched",
    PRODUCT_LIST_GET: "Product list fetched",
    PRODUCT_ACTIVATED: "Product activated",
    PRODUCT_DEACTIVATED: "Product deactivated",
    PRODUCT_STOCK_UPDATED: "Stock updated",
    PRODUCT_LIST_BY_ID: "Product list by ID fetched successfully"
  },
 PRODUCT_GALLERY: {
    PRODUCT_GALLERY_CREATED: "Product gallery images added successfully",
    PRODUCT_GALLERY_UPDATED: "Product gallery updated successfully",
    PRODUCT_GALLERY_DELETED: "Product gallery images deleted successfully",
    PRODUCT_GALLERY_GET: "Product gallery fetched successfully",
    PRODUCT_GALLERY_LIST_GET: "Product gallery list fetched successfully"
  },
  VARIANT: {
    VARIANT_CREATED: "Variant created",
    VARIANT_UPDATED: "Variant updated",
    VARIANT_DELETED: "Variant deleted",
    VARIANT_GET: "Variant fetched",
    VARIANT_LIST_GET: "Variant list fetched"
  },

  CATEGORY: {
    CATEGORY_CREATED: "Category created",
    CATEGORY_UPDATED: "Category updated",
    CATEGORY_DELETED: "Category deleted",
    CATEGORY_GET: "Category fetched",
    CATEGORY_LIST_GET: "Category list fetched",
    CATEGORY_ACTIVATED: "Category activated",
    CATEGORY_DEACTIVATED: "Category deactivated",
    CATEGORY_LIST_BY_ID: "Category list by ID fetched successfully"
  },

  BRAND: {
    BRAND_CREATED: "Brand created successfully",
    BRAND_UPDATED: "Brand updated successfully",
    BRAND_DELETED: "Brand deleted successfully",
    BRAND_GET: "Brand fetched successfully",
    BRAND_LIST_GET: "Brand list fetched successfully",
    BRAND_LIST_BY_ID: "Brand list by ID fetched successfully",
    BRAND_ACTIVATED: "Brand activated successfully",
    BRAND_DEACTIVATED: "Brand deactivated successfully"
  },

  ORDER: {
    ORDER_CREATED: "Order placed",
    ORDER_UPDATED: "Order updated",
    ORDER_CANCELLED: "Order cancelled",
    ORDER_COMPLETED: "Order completed",
    ORDER_SHIPPED: "Order shipped",
    ORDER_DELIVERED: "Order delivered",
    ORDER_GET: "Order fetched",
    ORDER_LIST_GET: "Order list fetched",
    ORDER_STATUS_UPDATED: "Order status updated"
  },

  CART: {
    ITEM_ADDED: "Item added to cart",
    ITEM_UPDATED: "Cart item updated",
    ITEM_REMOVED: "Item removed",
    CART_CLEARED: "Cart cleared",
    CART_GET: "Cart fetched",
    QUANTITY_UPDATED: "Quantity updated"
  },

  PAYMENT: {
    PAYMENT_SUCCESS: "Payment processed",
    PAYMENT_INITIATED: "Payment initiated",
    REFUND_PROCESSED: "Refund processed",
    TRANSACTION_CREATED: "Transaction created",
    TRANSACTION_UPDATED: "Transaction updated"
  },

  VOUCHER: {
    VOUCHER_CREATED: "Voucher created",
    VOUCHER_UPDATED: "Voucher updated",
    VOUCHER_DELETED: "Voucher deleted",
    VOUCHER_APPLIED: "Voucher applied",
    VOUCHER_REMOVED: "Voucher removed",
    VOUCHER_GET: "Voucher fetched",
    VOUCHER_LIST_GET: "Voucher list fetched",
    VOUCHER_LIST_BY_ID: "Voucher fetched by ID"
  },

  REVIEW: {
    REVIEW_CREATED: "Review submitted",
    REVIEW_UPDATED: "Review updated",
    REVIEW_DELETED: "Review deleted",
    REVIEW_GET: "Review fetched",
    REVIEW_LIST_GET: "Review list fetched",
    REVIEW_APPROVED: "Review approved",
    REVIEW_REJECTED: "Review rejected"
  },

  SHIPPING: {
    ADDRESS_CREATED: "Address created",
    ADDRESS_UPDATED: "Address updated",
    ADDRESS_DELETED: "Address deleted",
    ADDRESS_GET: "Address fetched",
    ADDRESS_LIST_GET: "Addresses fetched",
    DEFAULT_ADDRESS_SET: "Default address set"
  },

  BLOG: {
    BLOG_CREATED: "Blog post created",
    BLOG_UPDATED: "Blog post updated",
    BLOG_DELETED: "Blog post deleted",
    BLOG_GET: "Blog post fetched",
    BLOG_LIST_GET: "Blog list fetched",
    BLOG_PUBLISHED: "Blog post published",
    BLOG_UNPUBLISHED: "Blog post unpublished"
  },

  GALLERY: {
    IMAGE_UPLOADED: "Image uploaded",
    IMAGE_DELETED: "Image deleted",
    IMAGE_UPDATED: "Image updated",
    GALLERY_GET: "Gallery fetched"
  },

  COLORS: {
    COLOR_CREATED: "Color created",
    COLOR_UPDATED: "Color updated",
    COLOR_DELETED: "Color deleted",
    COLOR_GET: "Color fetched",
    COLOR_LIST_GET: "Color list fetched",
    COLOR_LIST_BY_ID: "Color fetched by ID"
  },

  CANCEL: {
    CANCEL_REQUESTED: "Cancellation request submitted",
    CANCEL_APPROVED: "Cancellation approved",
    CANCEL_REJECTED: "Cancellation rejected",
    CANCEL_PROCESSED: "Cancellation processed"
  },

  UPLOAD: {
    FILE_UPLOADED: "File uploaded",
    FILES_UPLOADED: "Files uploaded",
    FILE_DELETED: "File deleted"
  },

  GENERAL: {
    OPERATION_SUCCESS: "Operation successful",
    DATA_RETRIEVED: "Data fetched",
    DATA_UPDATED: "Data updated",
    DATA_DELETED: "Data deleted",
    DATA_CREATED: "Data created",
    STATUS_UPDATED: "Status updated",
    SETTINGS_SAVED: "Settings saved"
  }
} as const;

export const ErrorMessages = {
  AUTH: {
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    INVALID_TOKEN: "Invalid or expired token",
    TOKEN_EXPIRED: "Token expired",
    INVALID_CREDENTIALS: "Invalid email or password",
    ACCOUNT_DEACTIVATED: "Account deactivated",
    PERMISSION_DENIED: "Permission denied"
  },

  VALIDATION: {
    VALIDATION_FAILED: "Validation failed",
    VALIDATION_ERROR: "Validation error",
    REQUIRED_FIELD: "Field required",
    INVALID_FORMAT: "Invalid format",
    INVALID_EMAIL: "Invalid email",
    INVALID_PHONE: "Invalid phone",
    PASSWORD_TOO_SHORT: "Password too short",
    INVALID_ID: "Invalid ID",
    INVALID_PARAMS: "Invalid parameters"
  },

  USER: {
    USER_NOT_FOUND: "User not found",
    USER_ALREADY_EXISTS: "User already exists",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    PHONE_ALREADY_EXISTS: "Phone already exists",
    ALL_ALREADY_EXISTS: "Email and phone already exist",
    USER_NOT_VERIFIED: "User not verified"
  },

  PRODUCT: {
    PRODUCT_NOT_FOUND: "Product not found",
    PRODUCT_ALREADY_EXISTS: "Product already exists",
    PRODUCT_OUT_OF_STOCK: "Out of stock",
    INSUFFICIENT_STOCK: "Insufficient stock",
    PRODUCT_INACTIVE: "Product inactive",
    CREATE_PRODUCT_FAILED: "Failed to create product",
    UPDATE_PRODUCT_FAILED: "Failed to update product",
    DELETE_PRODUCT_FAILED: "Failed to delete product",
    FAILED_TO_FETCH_PRODUCT: "Failed to fetch products",
    FAILED_UPDATE_PRODUCT: "Failed to update product",
    FAILED_TO_FETCH_PRODUCT_BY_ID: "Failed to fetch product by ID",
    FAILED_DELETE_PRODUCT: "Failed to delete product",
    
  },

  PRODUCT_GALLERY: {
    PRODUCT_GALLERY_NOT_FOUND: "Product gallery not found",
    ADD_FAILED: "Failed to add images to product gallery",
    REMOVE_FAILED: "Failed to remove images from product gallery",
    UPDATE_FAILED: "Failed to update product gallery",
    FAILED_TO_FETCH_GALLERY: "Failed to fetch product gallery",
    FAILED_DELETE_GALLERY: "Failed to delete product gallery"
  },

  VARIANT: {
    VARIANT_NOT_FOUND: "Variant not found",
    VARIANT_OUT_OF_STOCK: "Variant out of stock",
    INVALID_SIZE: "Invalid size",
    INVALID_COLOR: "Invalid color",
    SIZE_OUT_OF_STOCK: "Size out of stock",
    COLOR_OUT_OF_STOCK: "Color out of stock"
  },

  CATEGORY: {
    CATEGORY_NOT_FOUND: "Category not found",
    CATEGORY_ALREADY_EXISTS: "Category already exists",
    CATEGORY_IN_USE: "Category in use",
    CREATE_CATEGORY_FAILED: "Failed to create category",
    FAILED_TO_FETCH_CATEGORY: "Failed to fetch category",
    FAILED_UPDATE_CATEGORY: "Failed to update category",
    FAILED_TO_FETCH_CATEGORY_BY_ID: "Failed to fetch category by ID",
    FAILED_DELETE_CATEGORY: "Failed to delete category"
  },

  BRAND: {
    BRAND_NOT_FOUND: "Brand not found",
    BRAND_ALREADY_EXISTS: "Brand already exists",
    BRAND_NAME_ALREADY_EXISTS: "Brand name already exists",
    BRAND_IN_USE: "Brand in use",
    CREATE_BRAND_FAILED: "Failed to create brand",
    FAILED_TO_FETCH_BRAND: "Failed to fetch brand",
    FAILED_UPDATE_BRAND: "Failed to update brand",
    FAILED_TO_FETCH_BRAND_BY_ID: "Failed to fetch brand by ID",
    FAILED_DELETE_BRAND: "Failed to delete brand"
  },

  COLORS: {
    COLOR_NOT_FOUND: "Color not found",
    COLOR_ALREADY_EXISTS: "Color already exists",
    CREATE_COLOR_FAILED: "Failed to create color",
    FAILED_TO_FETCH_COLORS: "Failed to fetch colors",
    FAILED_TO_FETCH_COLOR_BY_ID: "Failed to fetch color by ID",
    FAILED_TO_UPDATE_COLOR: "Failed to update color",
    FAILED_TO_DELETE_COLOR: "Failed to delete color"
  },

  ORDER: {
    ORDER_NOT_FOUND: "Order not found",
    ORDER_CANNOT_BE_CANCELLED: "Cannot cancel order",
    ORDER_ALREADY_CANCELLED: "Order already cancelled",
    ORDER_ALREADY_COMPLETED: "Order already completed",
    ORDER_ALREADY_SHIPPED: "Order already shipped",
    INVALID_ORDER_STATUS: "Invalid order status",
    ORDER_DETAILS_NOT_FOUND: "Order details not found"
  },

  CART: {
    CART_NOT_FOUND: "Cart not found",
    CART_ITEM_NOT_FOUND: "Item not in cart",
    CART_IS_EMPTY: "Cart is empty",
    ITEM_ALREADY_IN_CART: "Item already in cart",
    CART_QUANTITY_EXCEEDED: "Quantity exceeds stock",
    FAILED_TO_FETCH_CART: "Failed to fetch cart",
    ADD_ITEM_FAILED: "Failed to add item to cart",
    UPDATE_ITEM_FAILED: "Failed to update cart item",
    REMOVE_ITEM_FAILED: "Failed to remove item from cart",
    CLEAR_CART_FAILED: "Failed to clear cart"
  },

  PAYMENT: {
    PAYMENT_FAILED: "Payment failed",
    PAYMENT_PENDING: "Payment pending",
    PAYMENT_CANCELLED: "Payment cancelled",
    TRANSACTION_NOT_FOUND: "Transaction not found",
    TRANSACTION_FAILED: "Transaction failed",
    REFUND_FAILED: "Refund failed",
    INVALID_PAYMENT_METHOD: "Invalid payment method"
  },

  VOUCHER: {
    VOUCHER_NOT_FOUND: "Voucher not found",
    VOUCHER_EXPIRED: "Voucher expired",
    VOUCHER_ALREADY_USED: "Voucher already used",
    VOUCHER_INACTIVE: "Voucher inactive",
    VOUCHER_NOT_APPLICABLE: "Voucher not applicable",
    VOUCHER_LIMIT_EXCEEDED: "Voucher limit exceeded",
    VOUCHER_CODE_ALREADY_EXISTS: "Voucher code already exists",
    CREATE_VOUCHER_FAILED: "Failed to create voucher",
    FAILED_TO_FETCH_VOUCHER: "Failed to fetch vouchers",
    FAILED_UPDATE_VOUCHER: "Failed to update voucher",
    FAILED_TO_FETCH_VOUCHER_BY_ID: "Failed to fetch voucher by ID",
    FAILED_DELETE_VOUCHER: "Failed to delete voucher"
  },

  REVIEW: {
    REVIEW_NOT_FOUND: "Review not found",
    REVIEW_ALREADY_EXISTS: "Already reviewed",
    REVIEW_NOT_ALLOWED: "Not allowed to review",
    REVIEW_INACTIVE: "Review inactive",
    CREATE_REVIEW_FAILED: "Failed to create review",
    FAILED_TO_FETCH_REVIEW: "Failed to fetch reviews",
    FAILED_UPDATE_REVIEW: "Failed to update review",
    FAILED_TO_FETCH_REVIEW_BY_ID: "Failed to fetch review by ID",
    FAILED_DELETE_REVIEW: "Failed to delete review"
  },

  SHIPPING: {
    SHIPPING_ADDRESS_NOT_FOUND: "Shipping address not found",
    INVALID_ADDRESS_TYPE: "Invalid address type",
    DEFAULT_ADDRESS_REQUIRED: "Default address required"
  },

  BLOG: {
    CREATE_BLOG_FAILED: "Failed to create blog post",
    BLOG_NOT_FOUND: "Blog post not found",
    BLOG_ALREADY_EXISTS: "Blog post already exists",
    BLOG_INACTIVE: "Blog post inactive"
  },

  GALLERY: {
    GALLERY_IMAGE_NOT_FOUND: "Gallery image not found",
    INVALID_IMAGE_FORMAT: "Invalid image format",
    IMAGE_UPLOAD_FAILED: "Image upload failed",
    TOO_MANY_IMAGES: "Too many images"
  },

  CANCEL: {
    CANCEL_REQUEST_NOT_FOUND: "Cancellation request not found",
    CANCEL_REQUEST_ALREADY_PROCESSED: "Request already processed",
    CANCEL_NOT_ALLOWED: "Cancellation not allowed"
  },

  UPLOAD: {
    FILE_TOO_LARGE: "File too large",
    INVALID_FILE_TYPE: "Invalid file type",
    UPLOAD_FAILED: "Upload failed",
    FILE_NOT_FOUND: "File not found"
  },

  SERVER: {
    DATABASE_ERROR: "Database error",
    CONNECTION_ERROR: "Connection error",
    INTERNAL_SERVER_ERROR: "Internal server error",
    SERVER_ERROR: "Server error",
    SERVICE_UNAVAILABLE: "Service unavailable"
  },

  GENERAL: {
    BAD_REQUEST: "Bad request",
    NOT_FOUND: "Resource not found",
    OPERATION_FAILED: "Operation failed",
    DUPLICATE_ENTRY: "Duplicate entry",
    CONSTRAINT_VIOLATION: "Constraint violation",
    RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
    MAINTENANCE_MODE: "System under maintenance"
  }
} as const;


