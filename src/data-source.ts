import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: false, // Disabled temporarily to avoid migration issues
  logging: false,
  entities: [
    process.env.NODE_ENV === "production"
      ? "dist/entities/**/*.js"
      : "src/entities/**/*.ts",
  ],
  migrations: [
    process.env.NODE_ENV === "production"
      ? "dist/migrations/**/*.js"
      : "src/migrations/**/*.ts",
  ],
  subscribers: [],
});
