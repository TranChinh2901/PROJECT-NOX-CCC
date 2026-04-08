import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initDatabase } from "@/database/connect-database";
import router from "@/routes";
import { exceptionHandler } from "@/middlewares/exception-filter";
import { loadedEnv } from "@/config/load-env";
import { requestLogger } from "@/middlewares/logger-filter";
import { logger } from "@/utils/logger";
import { attachNotificationWebSocketGateway } from "@/modules/notification/infrastructure/NotificationWebSocketGateway";

const app = express();
const server = createServer(app);
const PORT = loadedEnv.port;

const allowedOrigins = (process.env.CORS_ORIGIN || [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
].join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/", router);

app.use(exceptionHandler);

const startServer = async () => {
  try {
    await initDatabase();
    attachNotificationWebSocketGateway(server);
    server.listen(PORT, () => {
      logger.success(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Server startup aborted because the database is unavailable");
    process.exit(1);
  }
};

void startServer();
