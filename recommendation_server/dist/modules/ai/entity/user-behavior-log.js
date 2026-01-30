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
exports.UserBehaviorLog = void 0;
const typeorm_1 = require("typeorm");
const user_session_1 = require("@/modules/users/entity/user-session");
const user_entity_1 = require("@/modules/users/entity/user.entity");
const product_1 = require("@/modules/products/entity/product");
const product_variant_1 = require("@/modules/products/entity/product-variant");
const user_behavior_enum_1 = require("../enum/user-behavior.enum");
const user_session_enum_1 = require("@/modules/users/enum/user-session.enum");
let UserBehaviorLog = class UserBehaviorLog {
    id;
    session_id;
    session;
    user_id;
    user;
    action_type;
    product_id;
    product;
    variant_id;
    variant;
    search_query;
    metadata;
    device_type;
    referrer_url;
    page_url;
    ip_address;
    session_duration_seconds;
    created_at;
};
exports.UserBehaviorLog = UserBehaviorLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserBehaviorLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserBehaviorLog.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_session_1.UserSession, session => session.id),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", user_session_1.UserSession)
], UserBehaviorLog.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserBehaviorLog.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.id, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserBehaviorLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_behavior_enum_1.UserActionType }),
    __metadata("design:type", String)
], UserBehaviorLog.prototype, "action_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserBehaviorLog.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_1.Product, product => product.id, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_1.Product)
], UserBehaviorLog.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserBehaviorLog.prototype, "variant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_variant_1.ProductVariant, variant => variant.id, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", product_variant_1.ProductVariant)
], UserBehaviorLog.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], UserBehaviorLog.prototype, "search_query", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], UserBehaviorLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_session_enum_1.DeviceType }),
    __metadata("design:type", String)
], UserBehaviorLog.prototype, "device_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], UserBehaviorLog.prototype, "referrer_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], UserBehaviorLog.prototype, "page_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 45, nullable: true }),
    __metadata("design:type", String)
], UserBehaviorLog.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserBehaviorLog.prototype, "session_duration_seconds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserBehaviorLog.prototype, "created_at", void 0);
exports.UserBehaviorLog = UserBehaviorLog = __decorate([
    (0, typeorm_1.Entity)('user_behavior_logs'),
    (0, typeorm_1.Index)(['session_id', 'created_at']),
    (0, typeorm_1.Index)(['user_id']),
    (0, typeorm_1.Index)(['action_type']),
    (0, typeorm_1.Index)(['product_id'])
], UserBehaviorLog);
