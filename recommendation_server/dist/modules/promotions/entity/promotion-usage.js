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
exports.PromotionUsage = void 0;
const typeorm_1 = require("typeorm");
const promotion_1 = require("./promotion");
const order_1 = require("@/modules/orders/entity/order");
const user_entity_1 = require("@/modules/users/entity/user.entity");
let PromotionUsage = class PromotionUsage {
    id;
    promotion_id;
    promotion;
    order_id;
    order;
    user_id;
    user;
    discount_amount;
    used_at;
};
exports.PromotionUsage = PromotionUsage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PromotionUsage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PromotionUsage.prototype, "promotion_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => promotion_1.Promotion, promotion => promotion.usages),
    (0, typeorm_1.JoinColumn)({ name: 'promotion_id' }),
    __metadata("design:type", promotion_1.Promotion)
], PromotionUsage.prototype, "promotion", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PromotionUsage.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_1.Order, order => order.id),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_1.Order)
], PromotionUsage.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PromotionUsage.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.id),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], PromotionUsage.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PromotionUsage.prototype, "discount_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PromotionUsage.prototype, "used_at", void 0);
exports.PromotionUsage = PromotionUsage = __decorate([
    (0, typeorm_1.Entity)('promotion_usage'),
    (0, typeorm_1.Index)(['promotion_id']),
    (0, typeorm_1.Index)(['order_id']),
    (0, typeorm_1.Index)(['user_id'])
], PromotionUsage);
