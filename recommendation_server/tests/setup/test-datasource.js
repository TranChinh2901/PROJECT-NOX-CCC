"use strict";
/**
 * Shared test database configuration.
 * Uses migration-driven MySQL when TEST_DB_* env vars are provided and
 * falls back to in-memory SQLite for lightweight local test runs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestDataSource = createTestDataSource;
exports.getTestDataSource = getTestDataSource;
exports.closeTestDataSource = closeTestDataSource;
exports.resetTestDatabase = resetTestDatabase;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
const typeorm_1 = require("typeorm");
const load_entities_1 = require("@/config/load-entities");
const typeorm_naming_strategy_1 = require("@/database/typeorm-naming.strategy");
let testDataSource;
const resolveTestDatabaseType = () => (process.env.TEST_DATABASE_TYPE ?? process.env.TEST_DB_TYPE ?? 'mariadb');
function createTestDataSource() {
    const hasMysqlConfig = Boolean(process.env.TEST_DB_HOST &&
        process.env.TEST_DB_PORT &&
        process.env.TEST_DB_USERNAME &&
        process.env.TEST_DB_NAME);
    if (hasMysqlConfig) {
        return new typeorm_1.DataSource({
            type: resolveTestDatabaseType(),
            host: process.env.TEST_DB_HOST,
            port: Number(process.env.TEST_DB_PORT),
            username: process.env.TEST_DB_USERNAME,
            password: process.env.TEST_DB_PASSWORD,
            database: process.env.TEST_DB_NAME,
            entities: load_entities_1.entities,
            migrations: [path_1.default.join(process.cwd(), 'src/database/migrations/*{.ts,.js}')],
            migrationsRun: true,
            logging: false,
            namingStrategy: new typeorm_naming_strategy_1.ProjectNamingStrategy(),
        });
    }
    return new typeorm_1.DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: load_entities_1.entities,
        synchronize: true,
        logging: false,
        dropSchema: false,
    });
}
function getTestDataSource() {
    if (!testDataSource) {
        testDataSource = createTestDataSource();
    }
    return testDataSource;
}
async function closeTestDataSource() {
    if (testDataSource && testDataSource.isInitialized) {
        await testDataSource.destroy();
    }
}
async function resetTestDatabase() {
    const dataSource = getTestDataSource();
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }
    if (dataSource.options.type === 'mysql' || dataSource.options.type === 'mariadb') {
        await dataSource.dropDatabase();
        await dataSource.runMigrations();
        return;
    }
    await dataSource.query('PRAGMA foreign_keys = OFF');
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        try {
            await repository.query(`DELETE FROM ${entity.tableName}`);
        }
        catch (error) {
        }
    }
    await dataSource.query('PRAGMA foreign_keys = ON');
}
