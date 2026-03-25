
import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";

import { loadedEnv } from "./load-env";
import { entities } from "@/config/load-entities";
import { ProjectNamingStrategy } from "@/database/typeorm-naming.strategy";

const migrationPaths = [path.join(__dirname, "..", "database", "migrations", "*{.ts,.js}")];

export const AppDataSource = new DataSource({
  type: loadedEnv.db.type,
  host: loadedEnv.db.host,
  port: loadedEnv.db.port,
  username: loadedEnv.db.username,
  password: loadedEnv.db.password,
  database: loadedEnv.db.database,
  synchronize: false,
  migrations: migrationPaths,
  logging: false,
  entities: entities,
  namingStrategy: new ProjectNamingStrategy(),
});
