"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireAdmin = exports.requireUser = exports.requireAuth = exports.authMiddleware = void 0;
const auth_service_1 = __importDefault(require("@/modules/auth/auth.service"));
const error_response_1 = require("@/common/error.response");
const status_code_1 = require("@/constants/status-code");
const auth_enum_1 = require("@/modules/auth/enum/auth.enum");
const error_code_1 = require("@/constants/error-code");
const authMiddleware = (requiredRole) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw new error_response_1.AppError('No authentication token provided', status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.UNAUTHORIZED, { reason: 'missing_token' });
        }
        try {
            const decoded = auth_service_1.default.verifyToken(token);
            console.log(decoded);
            if (!decoded) {
                throw new error_response_1.AppError('Invalid or malformed authentication token', status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.INVALID_TOKEN, { reason: 'token_verification_failed' });
            }
            if (requiredRole && !(0, auth_enum_1.hasPermission)(decoded.role, requiredRole)) {
                throw new error_response_1.AppError('Insufficient permissions to access this resource', status_code_1.HttpStatusCode.FORBIDDEN, error_code_1.ErrorCode.FORBIDDEN, {
                    requiredRole,
                    userRole: decoded.role,
                    reason: 'insufficient_permissions'
                });
            }
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
            next();
        }
        catch (error) {
            if (error instanceof error_response_1.AppError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            throw new error_response_1.AppError(errorMessage, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.INVALID_TOKEN, {
                reason: 'authentication_error',
                originalError: error instanceof Error ? error.message : String(error)
            });
        }
    };
};
exports.authMiddleware = authMiddleware;
const requireAuth = () => (0, exports.authMiddleware)();
exports.requireAuth = requireAuth;
const requireUser = () => (0, exports.authMiddleware)(auth_enum_1.RoleType.USER);
exports.requireUser = requireUser;
const requireAdmin = () => (0, exports.authMiddleware)(auth_enum_1.RoleType.ADMIN);
exports.requireAdmin = requireAdmin;
const requireAnyRole = (roles) => {
    return (req, res, next) => {
        const authCheck = (0, exports.authMiddleware)();
        authCheck(req, res, (error) => {
            if (error)
                return next(error);
            const userRole = req.user?.role;
            if (!userRole || !roles.some(role => (0, auth_enum_1.hasPermission)(userRole, role))) {
                throw new error_response_1.AppError('Insufficient permissions to access this resource', status_code_1.HttpStatusCode.FORBIDDEN, error_code_1.ErrorCode.FORBIDDEN, {
                    requiredRoles: roles,
                    userRole,
                    reason: 'insufficient_permissions'
                });
            }
            next();
        });
    };
};
exports.requireAnyRole = requireAnyRole;
