"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = exports.initDatabase = void 0;
const database_config_1 = require("@/config/database.config");
Object.defineProperty(exports, "AppDataSource", { enumerable: true, get: function () { return database_config_1.AppDataSource; } });
const logger_1 = require("@/utils/logger");
const initDatabase = async () => {
    try {
        await database_config_1.AppDataSource.initialize();
        logger_1.logger.success("Database connected!");
    }
    catch (error) {
        logger_1.logger.error(`Failed to connect database: ${error}`);
    }
};
exports.initDatabase = initDatabase;
