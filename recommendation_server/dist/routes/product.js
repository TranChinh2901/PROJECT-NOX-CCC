"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = __importDefault(require("@/modules/products/product.controller"));
const router = (0, express_1.Router)();
router.get('/', product_controller_1.default.getAllProducts);
router.get('/search', product_controller_1.default.searchProducts);
router.get('/featured', product_controller_1.default.getFeaturedProducts);
router.get('/slug/:slug', product_controller_1.default.getProductBySlug);
router.get('/:id/related', product_controller_1.default.getRelatedProducts);
router.get('/:id', product_controller_1.default.getProductById);
exports.default = router;
