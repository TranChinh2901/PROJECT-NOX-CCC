import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initDatabase } from "@/database/connect-database";
import router from "@/routes";
import { exceptionHandler } from "@/middlewares/exception-filter";
import { loadedEnv } from "@/config/load-env";
import { requestLogger } from "@/middlewares/logger-filter";
import { logger } from "@/utils/logger";
import { isRequestOriginAllowed } from "@/utils/origin";
import { attachNotificationWebSocketGateway } from "@/modules/notification/infrastructure/NotificationWebSocketGateway";
import { RecommendationRefreshScheduler } from "@/modules/ai/infrastructure/jobs/RecommendationRefreshScheduler";

const app = express();
const server = createServer(app);
const PORT = loadedEnv.port;
const recommendationRefreshScheduler = new RecommendationRefreshScheduler({
  enabled: loadedEnv.recommendation.schedulerEnabled,
  intervalMinutes: loadedEnv.recommendation.refreshIntervalMinutes,
  runOnStart: loadedEnv.recommendation.runOnStart,
  days: loadedEnv.recommendation.days,
  topK: loadedEnv.recommendation.topK,
  topN: loadedEnv.recommendation.topN,
  ttlHours: loadedEnv.recommendation.ttlHours,
  algorithm: loadedEnv.recommendation.algorithm,
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isRequestOriginAllowed(origin)) {
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
    recommendationRefreshScheduler.start();
    server.listen(PORT, () => {
      logger.success(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Server startup aborted because the database is unavailable");
    process.exit(1);
  }
};

const shutdown = () => {
  recommendationRefreshScheduler.stop();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

void startServer();
