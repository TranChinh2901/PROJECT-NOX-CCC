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
exports.ReviewHelpful = void 0;
const typeorm_1 = require("typeorm");
const review_1 = require("./review");
const user_entity_1 = require("@/modules/users/entity/user.entity");
let ReviewHelpful = class ReviewHelpful {
    id;
    review_id;
    review;
    user_id;
    user;
    is_helpful;
    created_at;
};
exports.ReviewHelpful = ReviewHelpful;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReviewHelpful.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReviewHelpful.prototype, "review_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => review_1.Review, review => review.helpful_votes),
    (0, typeorm_1.JoinColumn)({ name: 'review_id' }),
    __metadata("design:type", review_1.Review)
], ReviewHelpful.prototype, "review", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReviewHelpful.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.id),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ReviewHelpful.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], ReviewHelpful.prototype, "is_helpful", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ReviewHelpful.prototype, "created_at", void 0);
exports.ReviewHelpful = ReviewHelpful = __decorate([
    (0, typeorm_1.Entity)('review_helpful'),
    (0, typeorm_1.Unique)(['review_id', 'user_id']),
    (0, typeorm_1.Index)(['review_id']),
    (0, typeorm_1.Index)(['user_id'])
], ReviewHelpful);
