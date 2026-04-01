import express from "express";
import cors from "cors";
import { initDatabase } from "@/database/connect-database";
import router from "@/routes";
import { exceptionHandler } from "@/middlewares/exception-filter";
import { loadedEnv } from "@/config/load-env";
import { requestLogger } from "@/middlewares/logger-filter";
import { logger } from "@/utils/logger";

const app = express();
const PORT = loadedEnv.port;

const allowedOrigins = (process.env.CORS_ORIGIN || [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  
].join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const localLanDevOriginPattern = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:30\d{2}$/;

app.use(
  cors({
    origin: (origin, callback) => {
      const isLanDevOrigin = typeof origin === 'string' && localLanDevOriginPattern.test(origin);
      if (!origin || allowedOrigins.includes(origin) || isLanDevOrigin) {
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
    app.listen(PORT, () => {
      logger.success(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Server startup aborted because the database is unavailable");
    process.exit(1);
  }
};

void startServer();
