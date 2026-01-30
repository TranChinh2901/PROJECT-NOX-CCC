"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = __importDefault(require("@/modules/products/category.controller"));
const router = (0, express_1.Router)();
router.get('/tree', category_controller_1.default.getCategoryTree);
router.get('/root', category_controller_1.default.getRootCategories);
router.get('/slug/:slug', category_controller_1.default.getCategoryBySlug);
router.get('/:id', category_controller_1.default.getCategoryById);
router.get('/', category_controller_1.default.getAllCategories);
exports.default = router;
