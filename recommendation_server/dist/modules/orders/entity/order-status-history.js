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
exports.OrderStatusHistory = void 0;
const typeorm_1 = require("typeorm");
const order_enum_1 = require("../enum/order.enum");
const order_1 = require("./order");
let OrderStatusHistory = class OrderStatusHistory {
    id;
    order_id;
    order;
    status;
    previous_status;
    changed_by;
    notes;
    created_at;
};
exports.OrderStatusHistory = OrderStatusHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], OrderStatusHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], OrderStatusHistory.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_1.Order, (order) => order.status_histories),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_1.Order)
], OrderStatusHistory.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: order_enum_1.OrderStatus }),
    __metadata("design:type", String)
], OrderStatusHistory.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: order_enum_1.OrderStatus, nullable: true }),
    __metadata("design:type", String)
], OrderStatusHistory.prototype, "previous_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], OrderStatusHistory.prototype, "changed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], OrderStatusHistory.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], OrderStatusHistory.prototype, "created_at", void 0);
exports.OrderStatusHistory = OrderStatusHistory = __decorate([
    (0, typeorm_1.Entity)('order_status_histories'),
    (0, typeorm_1.Index)(['order_id'])
], OrderStatusHistory);
