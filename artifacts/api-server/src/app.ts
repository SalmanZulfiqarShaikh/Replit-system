import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : true;

app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const staticDir =
    process.env.STATIC_DIR ||
    join(__dirname, "..", "..", "roadmap-app", "dist", "public");

  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(join(staticDir, "index.html"));
    });
  } else {
    logger.warn({ staticDir }, "Static directory not found — frontend not served");
  }
}

export default app;
