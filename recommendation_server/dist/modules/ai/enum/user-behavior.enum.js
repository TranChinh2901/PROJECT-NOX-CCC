"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActionType = void 0;
var UserActionType;
(function (UserActionType) {
    UserActionType["VIEW"] = "view";
    UserActionType["CLICK"] = "click";
    UserActionType["ADD_TO_CART"] = "add_to_cart";
    UserActionType["REMOVE_FROM_CART"] = "remove_from_cart";
    UserActionType["PURCHASE"] = "purchase";
    UserActionType["SEARCH"] = "search";
    UserActionType["WISHLIST_ADD"] = "wishlist_add";
    UserActionType["REVIEW_VIEW"] = "review_view";
})(UserActionType || (exports.UserActionType = UserActionType = {}));
