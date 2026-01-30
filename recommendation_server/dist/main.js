"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const connect_database_1 = require("@/database/connect-database");
const routes_1 = __importDefault(require("@/routes"));
const exception_filter_1 = require("@/middlewares/exception-filter");
const load_env_1 = require("@/config/load-env");
const logger_filter_1 = require("@/middlewares/logger-filter");
const logger_1 = require("@/utils/logger");
const app = (0, express_1.default)();
const PORT = load_env_1.loadedEnv.port;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(logger_filter_1.requestLogger);
(0, connect_database_1.initDatabase)();
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});
app.use("/", routes_1.default);
app.use(exception_filter_1.exceptionHandler);
app.listen(PORT, () => {
    logger_1.logger.success(`Server is running on port ${PORT}`);
});
