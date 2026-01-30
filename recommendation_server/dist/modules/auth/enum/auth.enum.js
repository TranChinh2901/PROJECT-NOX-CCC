"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.RoleHierarchy = exports.RoleType = void 0;
var RoleType;
(function (RoleType) {
    RoleType["ADMIN"] = "ADMIN";
    RoleType["USER"] = "USER";
})(RoleType || (exports.RoleType = RoleType = {}));
exports.RoleHierarchy = {
    [RoleType.ADMIN]: 100,
    [RoleType.USER]: 10,
};
const hasPermission = (userRole, requiredRole) => {
    return exports.RoleHierarchy[userRole] >= exports.RoleHierarchy[requiredRole];
};
exports.hasPermission = hasPermission;
