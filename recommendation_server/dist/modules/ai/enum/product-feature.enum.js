"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureSource = exports.ProductFeatureType = void 0;
var ProductFeatureType;
(function (ProductFeatureType) {
    ProductFeatureType["CATEGORY"] = "category";
    ProductFeatureType["STYLE"] = "style";
    ProductFeatureType["OCCASION"] = "occasion";
    ProductFeatureType["SEASON"] = "season";
    ProductFeatureType["PATTERN"] = "pattern";
    ProductFeatureType["FABRIC_TYPE"] = "fabric_type";
    ProductFeatureType["ATTRIBUTE"] = "attribute";
})(ProductFeatureType || (exports.ProductFeatureType = ProductFeatureType = {}));
var FeatureSource;
(function (FeatureSource) {
    FeatureSource["MANUAL"] = "manual";
    FeatureSource["AI_EXTRACTED"] = "ai_extracted";
    FeatureSource["IMPORTED"] = "imported";
})(FeatureSource || (exports.FeatureSource = FeatureSource = {}));
