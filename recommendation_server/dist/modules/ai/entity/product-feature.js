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
exports.ProductFeature = void 0;
const typeorm_1 = require("typeorm");
const product_1 = require("@/modules/products/entity/product");
const product_feature_enum_1 = require("../enum/product-feature.enum");
let ProductFeature = class ProductFeature {
    id;
    product_id;
    product;
    feature_type;
    feature_value;
    confidence_score;
    source;
    weight;
    created_at;
    updated_at;
};
exports.ProductFeature = ProductFeature;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProductFeature.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ProductFeature.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_1.Product, product => product.id),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_1.Product)
], ProductFeature.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: product_feature_enum_1.ProductFeatureType }),
    __metadata("design:type", String)
], ProductFeature.prototype, "feature_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ProductFeature.prototype, "feature_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ProductFeature.prototype, "confidence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: product_feature_enum_1.FeatureSource, default: product_feature_enum_1.FeatureSource.MANUAL }),
    __metadata("design:type", String)
], ProductFeature.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], ProductFeature.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductFeature.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductFeature.prototype, "updated_at", void 0);
exports.ProductFeature = ProductFeature = __decorate([
    (0, typeorm_1.Entity)('product_features'),
    (0, typeorm_1.Unique)(['product_id', 'feature_type', 'feature_value']),
    (0, typeorm_1.Index)(['product_id']),
    (0, typeorm_1.Index)(['feature_type']),
    (0, typeorm_1.Index)(['feature_value'])
], ProductFeature);
