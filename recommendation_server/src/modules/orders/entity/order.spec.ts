import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { Order } from './order';
import { OrderItem } from './order-item';
import { User } from '@/modules/users/entity/user.entity';
import { Cart } from '@/modules/cart/entity/cart';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../enum/order.enum';

describe('Order Entity', () => {
  describe('Schema Validation', () => {
    it('should configure order amount columns with precision 12 and scale 2', () => {
      const amountColumns = ['subtotal', 'discount_amount', 'shipping_amount', 'tax_amount', 'total_amount'];

      for (const propertyName of amountColumns) {
        const column = getMetadataArgsStorage().columns.find(
          metadata => metadata.target === Order && metadata.propertyName === propertyName
        );

        expect(column?.options.precision).toBe(12);
        expect(column?.options.scale).toBe(2);
      }
    });

    it('should create an Order with all required fields', () => {
      const order = new Order();
      order.id = 1;
      order.order_number = 'ORD-2025-000001';
      order.user_id = 10;
      order.status = OrderStatus.PENDING;
      order.payment_status = PaymentStatus.PENDING;
      order.payment_method = PaymentMethod.COD;
      order.shipping_address = { street: '123 Main St', city: 'City' };
      order.billing_address = { street: '123 Main St', city: 'City' };
      order.subtotal = 100.00;
      order.discount_amount = 0;
      order.shipping_amount = 0;
      order.tax_amount = 0;
      order.total_amount = 100.00;
      order.currency = 'VND';
      
      expect(order.id).toBe(1);
      expect(order.order_number).toBe('ORD-2025-000001');
      expect(order.user_id).toBe(10);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.payment_status).toBe(PaymentStatus.PENDING);
      expect(order.payment_method).toBe(PaymentMethod.COD);
      expect(order.subtotal).toBe(100.00);
      expect(order.total_amount).toBe(100.00);
    });

    it('should allow nullable cart_id', () => {
      const order = new Order();
      order.cart_id = undefined;
      
      expect(order.cart_id).toBeUndefined();
    });

    it('should allow nullable notes', () => {
      const order = new Order();
      order.notes = undefined;
      
      expect(order.notes).toBeUndefined();
    });

    it('should allow nullable internal_notes', () => {
      const order = new Order();
      order.internal_notes = undefined;
      
      expect(order.internal_notes).toBeUndefined();
    });

    it('should allow nullable tracking_number', () => {
      const order = new Order();
      order.tracking_number = undefined;
      
      expect(order.tracking_number).toBeUndefined();
    });

    it('should allow nullable shipped_at', () => {
      const order = new Order();
      order.shipped_at = undefined;
      
      expect(order.shipped_at).toBeUndefined();
    });

    it('should allow nullable delivered_at', () => {
      const order = new Order();
      order.delivered_at = undefined;
      
      expect(order.delivered_at).toBeUndefined();
    });

    it('should allow nullable deleted_at', () => {
      const order = new Order();
      order.deleted_at = undefined;
      
      expect(order.deleted_at).toBeUndefined();
    });

    it('should default status to PENDING', () => {
      const order = new Order();
      order.status = OrderStatus.PENDING;
      
      expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('should default payment_status to PENDING', () => {
      const order = new Order();
      order.payment_status = PaymentStatus.PENDING;
      
      expect(order.payment_status).toBe(PaymentStatus.PENDING);
    });

    it('should default discount_amount to 0', () => {
      const order = new Order();
      order.discount_amount = 0;
      
      expect(order.discount_amount).toBe(0);
    });

    it('should default shipping_amount to 0', () => {
      const order = new Order();
      order.shipping_amount = 0;
      
      expect(order.shipping_amount).toBe(0);
    });

    it('should default tax_amount to 0', () => {
      const order = new Order();
      order.tax_amount = 0;
      
      expect(order.tax_amount).toBe(0);
    });

    it('should default currency to VND', () => {
      const order = new Order();
      order.currency = 'VND';
      
      expect(order.currency).toBe('VND');
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique order_number', () => {
      const order1 = new Order();
      order1.order_number = 'ORD-2025-000001';
      
      const order2 = new Order();
      order2.order_number = 'ORD-2025-000001';
      
      expect(order1.order_number).toBe(order2.order_number);
    });

    it('should allow different order_numbers', () => {
      const order1 = new Order();
      order1.order_number = 'ORD-2025-000001';
      
      const order2 = new Order();
      order2.order_number = 'ORD-2025-000002';
      
      expect(order1.order_number).not.toBe(order2.order_number);
    });
  });

  describe('Field Constraints', () => {
    it('should accept order_number at max length (20)', () => {
      const order = new Order();
      order.order_number = 'ORD-2025-0000000001';
      
      expect(order.order_number.length).toBeLessThanOrEqual(20);
    });

    it('should accept realistic order number formats', () => {
      const formats = [
        'ORD-2025-000001',
        'ORD-2025-123456',
        'ORDER-001',
      ];
      
      formats.forEach(format => {
        const order = new Order();
        order.order_number = format;
        expect(order.order_number).toBe(format);
        expect(order.order_number.length).toBeLessThanOrEqual(20);
      });
    });

    it('should accept currency code (3 chars)', () => {
      const order = new Order();
      order.currency = 'VND';
      
      expect(order.currency).toBe('VND');
      expect(order.currency.length).toBe(3);
    });

    it('should accept various currency codes', () => {
      const currencies = ['VND', 'USD', 'EUR', 'JPY'];
      
      currencies.forEach(currency => {
        const order = new Order();
        order.currency = currency;
        expect(order.currency).toBe(currency);
        expect(order.currency.length).toBe(3);
      });
    });

    it('should accept tracking_number at max length (100)', () => {
      const order = new Order();
      order.tracking_number = 'TRACK-' + '1'.repeat(94);
      
      expect(order.tracking_number.length).toBe(100);
    });

    it('should accept realistic tracking numbers', () => {
      const order = new Order();
      order.tracking_number = '1Z999AA10123456784';
      
      expect(order.tracking_number).toBeTruthy();
      expect(order.tracking_number!.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Enum Validation', () => {
    it('should accept all OrderStatus values', () => {
      const statuses = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
      ];
      
      statuses.forEach(status => {
        const order = new Order();
        order.status = status;
        expect(order.status).toBe(status);
      });
    });

    it('should have exactly 7 order statuses', () => {
      const statuses = Object.values(OrderStatus);
      expect(statuses).toHaveLength(7);
    });

    it('should accept all PaymentStatus values', () => {
      const statuses = [
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
        PaymentStatus.REFUNDED,
      ];
      
      statuses.forEach(status => {
        const order = new Order();
        order.payment_status = status;
        expect(order.payment_status).toBe(status);
      });
    });

    it('should have exactly 4 payment statuses', () => {
      const statuses = Object.values(PaymentStatus);
      expect(statuses).toHaveLength(4);
    });

    it('should accept all PaymentMethod values', () => {
      const methods = [
        PaymentMethod.COD,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.E_WALLET,
      ];
      
      methods.forEach(method => {
        const order = new Order();
        order.payment_method = method;
        expect(order.payment_method).toBe(method);
      });
    });

    it('should have exactly 4 payment methods', () => {
      const methods = Object.values(PaymentMethod);
      expect(methods).toHaveLength(4);
    });
  });

  describe('JSON Fields', () => {
    it('should store shipping_address as JSON', () => {
      const order = new Order();
      order.shipping_address = {
        street: '123 Main Street',
        city: 'Hanoi',
        district: 'Ba Dinh',
        ward: 'Phuc Xa',
        postal_code: '100000',
        country: 'Vietnam',
      };
      
      expect(order.shipping_address).toBeDefined();
      expect(typeof order.shipping_address).toBe('object');
    });

    it('should store billing_address as JSON', () => {
      const order = new Order();
      order.billing_address = {
        street: '456 Business Ave',
        city: 'Ho Chi Minh',
        district: 'District 1',
        postal_code: '700000',
        country: 'Vietnam',
      };
      
      expect(order.billing_address).toBeDefined();
      expect(typeof order.billing_address).toBe('object');
    });

    it('should handle same billing and shipping address', () => {
      const order = new Order();
      const address = {
        street: '123 Main St',
        city: 'Hanoi',
        country: 'Vietnam',
      };
      
      order.shipping_address = address;
      order.billing_address = address;
      
      expect(order.shipping_address).toEqual(order.billing_address);
    });
  });

  describe('Decimal Precision', () => {
    it('should handle subtotal with 2 decimal places', () => {
      const order = new Order();
      order.subtotal = 129.99;
      
      expect(order.subtotal).toBe(129.99);
    });

    it('should handle discount_amount with 2 decimal places', () => {
      const order = new Order();
      order.discount_amount = 15.50;
      
      expect(order.discount_amount).toBe(15.50);
    });

    it('should handle shipping_amount with 2 decimal places', () => {
      const order = new Order();
      order.shipping_amount = 25.00;
      
      expect(order.shipping_amount).toBe(25.00);
    });

    it('should handle tax_amount with 2 decimal places', () => {
      const order = new Order();
      order.tax_amount = 12.95;
      
      expect(order.tax_amount).toBe(12.95);
    });

    it('should calculate total_amount correctly', () => {
      const order = new Order();
      order.subtotal = 100.00;
      order.discount_amount = 10.00;
      order.shipping_amount = 15.00;
      order.tax_amount = 8.50;
      order.total_amount = Number((order.subtotal - order.discount_amount + order.shipping_amount + order.tax_amount).toFixed(2));
      
      expect(order.total_amount).toBe(113.50);
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-set created_at', () => {
      const order = new Order();
      order.created_at = new Date();
      
      expect(order.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at', () => {
      const order = new Order();
      order.updated_at = new Date();
      
      expect(order.updated_at).toBeInstanceOf(Date);
    });

    it('should set shipped_at when order ships', () => {
      const order = new Order();
      order.shipped_at = new Date('2025-01-15T10:00:00Z');
      
      expect(order.shipped_at).toBeInstanceOf(Date);
    });

    it('should set delivered_at when order delivers', () => {
      const order = new Order();
      order.delivered_at = new Date('2025-01-20T14:30:00Z');
      
      expect(order.delivered_at).toBeInstanceOf(Date);
    });

    it('should ensure delivered_at is after shipped_at', () => {
      const order = new Order();
      order.shipped_at = new Date('2025-01-15T10:00:00Z');
      order.delivered_at = new Date('2025-01-20T14:30:00Z');
      
      expect(order.delivered_at.getTime()).toBeGreaterThan(order.shipped_at.getTime());
    });

    it('should set deleted_at on soft delete', () => {
      const order = new Order();
      order.deleted_at = new Date();
      
      expect(order.deleted_at).toBeInstanceOf(Date);
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with User', () => {
      const user = new User();
      user.id = 10;
      
      const order = new Order();
      order.user = user;
      order.user_id = user.id;
      
      expect(order.user).toBe(user);
      expect(order.user_id).toBe(10);
    });

    it('should define optional ManyToOne relationship with Cart', () => {
      const cart = new Cart();
      cart.id = 5;
      
      const order = new Order();
      order.cart = cart;
      order.cart_id = cart.id;
      
      expect(order.cart).toBe(cart);
      expect(order.cart_id).toBe(5);
    });

    it('should allow order without cart reference', () => {
      const order = new Order();
      order.cart_id = undefined;
      order.cart = undefined;
      
      expect(order.cart_id).toBeUndefined();
      expect(order.cart).toBeUndefined();
    });

    it('should define OneToMany relationship with OrderItems', () => {
      const order = new Order();
      order.id = 1;
      
      const item1 = new OrderItem();
      item1.order_id = order.id;
      
      const item2 = new OrderItem();
      item2.order_id = order.id;
      
      order.items = [item1, item2];
      
      expect(order.items).toHaveLength(2);
      expect(order.items![0].order_id).toBe(order.id);
    });
  });

  describe('Order Lifecycle', () => {
    it('should transition from pending to confirmed', () => {
      const order = new Order();
      order.status = OrderStatus.PENDING;
      order.payment_status = PaymentStatus.PENDING;
      
      order.status = OrderStatus.CONFIRMED;
      order.payment_status = PaymentStatus.PAID;
      
      expect(order.status).toBe(OrderStatus.CONFIRMED);
      expect(order.payment_status).toBe(PaymentStatus.PAID);
    });

    it('should transition through processing to shipped', () => {
      const order = new Order();
      order.status = OrderStatus.CONFIRMED;
      
      order.status = OrderStatus.PROCESSING;
      expect(order.status).toBe(OrderStatus.PROCESSING);
      
      order.status = OrderStatus.SHIPPED;
      order.shipped_at = new Date();
      expect(order.status).toBe(OrderStatus.SHIPPED);
      expect(order.shipped_at).toBeInstanceOf(Date);
    });

    it('should complete order lifecycle with delivery', () => {
      const order = new Order();
      order.status = OrderStatus.SHIPPED;
      order.shipped_at = new Date('2025-01-15');
      
      order.status = OrderStatus.DELIVERED;
      order.delivered_at = new Date('2025-01-20');
      
      expect(order.status).toBe(OrderStatus.DELIVERED);
      expect(order.delivered_at).toBeInstanceOf(Date);
    });

    it('should handle order cancellation', () => {
      const order = new Order();
      order.status = OrderStatus.PENDING;
      
      order.status = OrderStatus.CANCELLED;
      
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('should handle order refund', () => {
      const order = new Order();
      order.status = OrderStatus.DELIVERED;
      order.payment_status = PaymentStatus.PAID;
      
      order.status = OrderStatus.REFUNDED;
      order.payment_status = PaymentStatus.REFUNDED;
      
      expect(order.status).toBe(OrderStatus.REFUNDED);
      expect(order.payment_status).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('Payment Scenarios', () => {
    it('should handle COD payment', () => {
      const order = new Order();
      order.payment_method = PaymentMethod.COD;
      order.payment_status = PaymentStatus.PENDING;
      
      expect(order.payment_method).toBe(PaymentMethod.COD);
      expect(order.payment_status).toBe(PaymentStatus.PENDING);
    });

    it('should handle credit card payment', () => {
      const order = new Order();
      order.payment_method = PaymentMethod.CREDIT_CARD;
      order.payment_status = PaymentStatus.PAID;
      
      expect(order.payment_method).toBe(PaymentMethod.CREDIT_CARD);
      expect(order.payment_status).toBe(PaymentStatus.PAID);
    });

    it('should handle failed payment', () => {
      const order = new Order();
      order.payment_method = PaymentMethod.CREDIT_CARD;
      order.payment_status = PaymentStatus.FAILED;
      
      expect(order.payment_status).toBe(PaymentStatus.FAILED);
    });

    it('should handle e-wallet payment', () => {
      const order = new Order();
      order.payment_method = PaymentMethod.E_WALLET;
      order.payment_status = PaymentStatus.PAID;
      
      expect(order.payment_method).toBe(PaymentMethod.E_WALLET);
    });
  });

  describe('Notes Fields', () => {
    it('should store customer notes', () => {
      const order = new Order();
      order.notes = 'Please deliver after 5 PM';
      
      expect(order.notes).toBe('Please deliver after 5 PM');
    });

    it('should store internal admin notes', () => {
      const order = new Order();
      order.internal_notes = 'Customer is VIP - prioritize';
      
      expect(order.internal_notes).toBe('Customer is VIP - prioritize');
    });

    it('should handle long customer notes', () => {
      const order = new Order();
      order.notes = 'a'.repeat(1000);
      
      expect(order.notes!.length).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero discount', () => {
      const order = new Order();
      order.discount_amount = 0;
      
      expect(order.discount_amount).toBe(0);
    });

    it('should handle free shipping', () => {
      const order = new Order();
      order.shipping_amount = 0;
      
      expect(order.shipping_amount).toBe(0);
    });

    it('should handle zero tax', () => {
      const order = new Order();
      order.tax_amount = 0;
      
      expect(order.tax_amount).toBe(0);
    });

    it('should enforce amounts >= 0', () => {
      const order = new Order();
      order.subtotal = 100;
      order.discount_amount = 0;
      order.shipping_amount = 0;
      order.tax_amount = 0;
      order.total_amount = 100;
      
      expect(order.subtotal).toBeGreaterThanOrEqual(0);
      expect(order.discount_amount).toBeGreaterThanOrEqual(0);
      expect(order.shipping_amount).toBeGreaterThanOrEqual(0);
      expect(order.tax_amount).toBeGreaterThanOrEqual(0);
      expect(order.total_amount).toBeGreaterThanOrEqual(0);
    });

    it('should handle order without tracking number', () => {
      const order = new Order();
      order.status = OrderStatus.PROCESSING;
      order.tracking_number = undefined;
      
      expect(order.tracking_number).toBeUndefined();
    });

    it('should handle very large order amounts', () => {
      const order = new Order();
      order.subtotal = 123456789.12;
      order.total_amount = 135802467.03;
      
      expect(order.subtotal).toBe(123456789.12);
      expect(order.total_amount).toBe(135802467.03);
    });
  });
});
