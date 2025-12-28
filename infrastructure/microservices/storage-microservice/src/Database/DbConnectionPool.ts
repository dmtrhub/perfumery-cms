import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { StoragePackaging } from "../Domain/models/StoragePackaging";
import { Warehouse } from "../Domain/models/Warehouse";

dotenv.config();

export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  synchronize: true,
  logging: false,
  entities: [StoragePackaging, Warehouse],
});