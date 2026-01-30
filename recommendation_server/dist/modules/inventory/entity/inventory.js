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
exports.Inventory = void 0;
const typeorm_1 = require("typeorm");
const product_variant_1 = require("@/modules/products/entity/product-variant");
const warehouse_1 = require("./warehouse");
let Inventory = class Inventory {
    id;
    variant_id;
    variant;
    warehouse_id;
    warehouse;
    quantity_available;
    quantity_reserved;
    quantity_total;
    reorder_level;
    reorder_quantity;
    last_counted_at;
    created_at;
    updated_at;
};
exports.Inventory = Inventory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Inventory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Inventory.prototype, "variant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_variant_1.ProductVariant, variant => variant.id),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", product_variant_1.ProductVariant)
], Inventory.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Inventory.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_1.Warehouse, warehouse => warehouse.id),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_1.Warehouse)
], Inventory.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "quantity_available", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "quantity_reserved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "quantity_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 10 }),
    __metadata("design:type", Number)
], Inventory.prototype, "reorder_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Inventory.prototype, "reorder_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Inventory.prototype, "last_counted_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Inventory.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Inventory.prototype, "updated_at", void 0);
exports.Inventory = Inventory = __decorate([
    (0, typeorm_1.Entity)('inventory'),
    (0, typeorm_1.Unique)(['variant_id', 'warehouse_id']),
    (0, typeorm_1.Index)(['variant_id']),
    (0, typeorm_1.Index)(['warehouse_id']),
    (0, typeorm_1.Index)(['quantity_available'])
], Inventory);
