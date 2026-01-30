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
exports.RecommendationCache = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("@/modules/users/entity/user.entity");
const product_1 = require("@/modules/products/entity/product");
const recommendation_enum_1 = require("../enum/recommendation.enum");
let RecommendationCache = class RecommendationCache {
    id;
    user_id;
    user;
    product_id;
    product;
    recommendation_type;
    algorithm;
    recommended_products;
    context_data;
    expires_at;
    generated_at;
    cache_hit_count;
    is_active;
    created_at;
    updated_at;
};
exports.RecommendationCache = RecommendationCache;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RecommendationCache.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], RecommendationCache.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.id, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], RecommendationCache.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], RecommendationCache.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_1.Product, product => product.id, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_1.Product)
], RecommendationCache.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: recommendation_enum_1.RecommendationType }),
    __metadata("design:type", String)
], RecommendationCache.prototype, "recommendation_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'third_party' }),
    __metadata("design:type", String)
], RecommendationCache.prototype, "algorithm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], RecommendationCache.prototype, "recommended_products", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], RecommendationCache.prototype, "context_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RecommendationCache.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RecommendationCache.prototype, "generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RecommendationCache.prototype, "cache_hit_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], RecommendationCache.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RecommendationCache.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RecommendationCache.prototype, "updated_at", void 0);
exports.RecommendationCache = RecommendationCache = __decorate([
    (0, typeorm_1.Entity)('recommendation_cache'),
    (0, typeorm_1.Unique)(['user_id', 'product_id', 'recommendation_type']),
    (0, typeorm_1.Index)(['user_id']),
    (0, typeorm_1.Index)(['product_id']),
    (0, typeorm_1.Index)(['recommendation_type']),
    (0, typeorm_1.Index)(['expires_at']),
    (0, typeorm_1.Index)(['is_active'])
], RecommendationCache);
