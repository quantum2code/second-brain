import axios, { type AxiosInstance } from "axios";
import { env } from "@second-brain/env/server";

type ArcadeDbSqlBody = {
  language: "sql";
  command: string;
};

export function isAlreadyExistsError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const detail = error.response?.data?.detail;

  return typeof detail === "string" && detail.includes("already exists");
}

export class ArcadeDbClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.ARCADEDB_URL,
      auth: {
        username: env.ARCADEDB_USERNAME,
        password: env.ARCADEDB_PASSWORD,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async ensureDatabase(): Promise<void> {
    try {
      await this.http.post("/server", {
        command: `create database ${env.ARCADEDB_DATABASE}`,
      });
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        return;
      }

      throw error;
    }
  }

  async command<T = unknown>(command: string): Promise<T> {
    const body: ArcadeDbSqlBody = { language: "sql", command };
    const response = await this.http.post(`/command/${env.ARCADEDB_DATABASE}`, body);

    return response.data as T;
  }

  async query<T = unknown>(query: string): Promise<T> {
    const body: ArcadeDbSqlBody = { language: "sql", command: query };
    const response = await this.http.post(`/query/${env.ARCADEDB_DATABASE}`, body);

    return response.data as T;
  }
}

export const arcadeDb = new ArcadeDbClient();
