"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("@/modules/users/entity/user.entity");
const user_session_1 = require("@/modules/users/entity/user-session");
const cart_item_1 = require("./cart-item");
const cart_enum_1 = require("../enum/cart.enum");
let Cart = class Cart {
    id;
    user_id;
    user;
    session_id;
    session;
    status;
    total_amount;
    item_count;
    currency;
    expires_at;
    items;
    created_at;
    updated_at;
    deleted_at;
};
exports.Cart = Cart;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Cart.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Cart.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.id, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Cart.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Cart.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_session_1.UserSession, session => session.id, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", user_session_1.UserSession)
], Cart.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: cart_enum_1.CartStatus,
        default: cart_enum_1.CartStatus.ACTIVE
    }),
    __metadata("design:type", String)
], Cart.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Cart.prototype, "total_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cart.prototype, "item_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'VND' }),
    __metadata("design:type", String)
], Cart.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Cart.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => cart_item_1.CartItem, item => item.cart),
    __metadata("design:type", Array)
], Cart.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Cart.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Cart.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Cart.prototype, "deleted_at", void 0);
exports.Cart = Cart = __decorate([
    (0, typeorm_1.Entity)('carts'),
    (0, typeorm_1.Index)(['user_id']),
    (0, typeorm_1.Index)(['session_id']),
    (0, typeorm_1.Index)(['status'])
], Cart);
