"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("@/modules/auth/auth.controller"));
const login_schema_1 = require("@/modules/auth/schema/login.schema");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validate_middleware_1 = require("@/middlewares/validate.middleware");
const upload_middleware_1 = require("@/middlewares/upload.middleware");
const handle_error_1 = require("@/utils/handle-error");
const router = (0, express_1.Router)();
router.post('/register', 
// validateBody(RegisterSchema), 
(0, handle_error_1.asyncHandle)(auth_controller_1.default.register));
router.post('/login', (0, validate_middleware_1.validateBody)(login_schema_1.LoginSchema), (0, handle_error_1.asyncHandle)(auth_controller_1.default.login));
router.post('/refresh-token', (0, handle_error_1.asyncHandle)(auth_controller_1.default.refreshToken));
router.post('/logout', auth_middleware_1.authMiddleware, (0, handle_error_1.asyncHandle)(auth_controller_1.default.logout));
router.get('/profile', (0, auth_middleware_1.authMiddleware)(), (0, handle_error_1.asyncHandle)(auth_controller_1.default.getProfile));
router.get('/users', 
// authMiddleware(),
(0, handle_error_1.asyncHandle)(auth_controller_1.default.getAllUsers));
router.put('/profile', (0, auth_middleware_1.authMiddleware)(), (0, validate_middleware_1.validateBody)(login_schema_1.UpdateProfileSchema), (0, handle_error_1.asyncHandle)(auth_controller_1.default.updateProfile));
router.delete('/delete-account/:id', 
// authMiddleware(),
(0, handle_error_1.asyncHandle)(auth_controller_1.default.deleteAccount));
router.delete('/users/:id', 
// authMiddleware(),
// requireAdmin(),
(0, handle_error_1.asyncHandle)(auth_controller_1.default.deleteUserById));
router.put('/users/:id', 
// authMiddleware(),
// requireAdmin(),
(0, handle_error_1.asyncHandle)(auth_controller_1.default.updateUserById));
router.put('/upload-avatar', (0, auth_middleware_1.authMiddleware)(), upload_middleware_1.uploadAvatar.single('avatar'), (0, handle_error_1.asyncHandle)(auth_controller_1.default.uploadAvatar));
exports.default = router;
