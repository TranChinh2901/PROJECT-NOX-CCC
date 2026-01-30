"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryActionType = void 0;
var InventoryActionType;
(function (InventoryActionType) {
    InventoryActionType["SALE"] = "sale";
    InventoryActionType["RESTOCK"] = "restock";
    InventoryActionType["ADJUSTMENT"] = "adjustment";
    InventoryActionType["RETURN"] = "return";
    InventoryActionType["TRANSFER_IN"] = "transfer_in";
    InventoryActionType["TRANSFER_OUT"] = "transfer_out";
})(InventoryActionType || (exports.InventoryActionType = InventoryActionType = {}));
