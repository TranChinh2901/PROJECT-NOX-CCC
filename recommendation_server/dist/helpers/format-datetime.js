"use strict";
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateTime = exports.getVNTime = void 0;
// // trigger plugin
// dayjs.extend(utc);
// dayjs.extend(timezone);
// export const getVNTime = (): string => {
//   return dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
// };
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
// trigger plugin
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const getVNTime = (date) => {
    if (date) {
        return (0, dayjs_1.default)(date).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
    }
    return (0, dayjs_1.default)().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
};
exports.getVNTime = getVNTime;
// Thêm function format cho existing dates
const formatDateTime = (date) => {
    return (0, dayjs_1.default)(date).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
};
exports.formatDateTime = formatDateTime;
