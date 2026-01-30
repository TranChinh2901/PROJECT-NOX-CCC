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
exports.InventoryLog = void 0;
const typeorm_1 = require("typeorm");
const inventory_1 = require("./inventory");
const product_variant_1 = require("@/modules/products/entity/product-variant");
const warehouse_1 = require("./warehouse");
const inventory_enum_1 = require("../enum/inventory.enum");
let InventoryLog = class InventoryLog {
    id;
    inventory_id;
    inventory;
    variant_id;
    variant;
    warehouse_id;
    warehouse;
    action_type;
    quantity_change;
    quantity_before;
    quantity_after;
    reference_id;
    reference_type;
    notes;
    performed_by;
    created_at;
};
exports.InventoryLog = InventoryLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InventoryLog.prototype, "inventory_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_1.Inventory, inventory => inventory.id),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_id' }),
    __metadata("design:type", inventory_1.Inventory)
], InventoryLog.prototype, "inventory", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InventoryLog.prototype, "variant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_variant_1.ProductVariant, variant => variant.id),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", product_variant_1.ProductVariant)
], InventoryLog.prototype, "variant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InventoryLog.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_1.Warehouse, warehouse => warehouse.id),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_1.Warehouse)
], InventoryLog.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: inventory_enum_1.InventoryActionType }),
    __metadata("design:type", String)
], InventoryLog.prototype, "action_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryLog.prototype, "quantity_change", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryLog.prototype, "quantity_before", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryLog.prototype, "quantity_after", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], InventoryLog.prototype, "reference_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], InventoryLog.prototype, "reference_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryLog.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], InventoryLog.prototype, "performed_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryLog.prototype, "created_at", void 0);
exports.InventoryLog = InventoryLog = __decorate([
    (0, typeorm_1.Entity)('inventory_logs'),
    (0, typeorm_1.Index)(['inventory_id']),
    (0, typeorm_1.Index)(['variant_id']),
    (0, typeorm_1.Index)(['action_type']),
    (0, typeorm_1.Index)(['created_at'])
], InventoryLog);
