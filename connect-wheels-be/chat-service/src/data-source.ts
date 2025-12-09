import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';
dotenv.config();

export const ChatDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "connect_wheels_chat",
  synchronize: true,    // make false for production
  logging: false,
  entities: ["src/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
});

// ChatDataSource.initialize()
//     .then(() => {
//     console.log("Chat Data Source has been initialized!");
//   })
//   .catch((err) => {
//     console.error("Error during Chat Data Source initialization:", err);
//   });
