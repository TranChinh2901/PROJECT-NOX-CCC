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
exports.WishlistItem = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("@/modules/users/entity/user.entity");
const product_variant_1 = require("@/modules/products/entity/product-variant");
const wishlist_enum_1 = require("../enum/wishlist.enum");
let WishlistItem = class WishlistItem {
    id;
    user_id;
    user;
    variant_id;
    variant;
    notes;
    priority;
    added_at;
    created_at;
    updated_at;
};
exports.WishlistItem = WishlistItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WishlistItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WishlistItem.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.id),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], WishlistItem.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WishlistItem.prototype, "variant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_variant_1.ProductVariant, variant => variant.id),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", product_variant_1.ProductVariant)
], WishlistItem.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], WishlistItem.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: wishlist_enum_1.WishlistPriority,
        default: wishlist_enum_1.WishlistPriority.MEDIUM
    }),
    __metadata("design:type", String)
], WishlistItem.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WishlistItem.prototype, "added_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WishlistItem.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WishlistItem.prototype, "updated_at", void 0);
exports.WishlistItem = WishlistItem = __decorate([
    (0, typeorm_1.Entity)('wishlist_items'),
    (0, typeorm_1.Unique)(['user_id', 'variant_id']),
    (0, typeorm_1.Index)(['user_id']),
    (0, typeorm_1.Index)(['variant_id'])
], WishlistItem);
