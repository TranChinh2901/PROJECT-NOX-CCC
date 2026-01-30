"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionAppliesTo = exports.PromotionType = void 0;
var PromotionType;
(function (PromotionType) {
    PromotionType["PERCENTAGE"] = "percentage";
    PromotionType["FIXED_AMOUNT"] = "fixed_amount";
    PromotionType["FREE_SHIPPING"] = "free_shipping";
})(PromotionType || (exports.PromotionType = PromotionType = {}));
var PromotionAppliesTo;
(function (PromotionAppliesTo) {
    PromotionAppliesTo["ALL"] = "all";
    PromotionAppliesTo["CATEGORIES"] = "categories";
    PromotionAppliesTo["PRODUCTS"] = "products";
})(PromotionAppliesTo || (exports.PromotionAppliesTo = PromotionAppliesTo = {}));
