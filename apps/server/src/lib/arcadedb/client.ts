import axios, { type AxiosInstance } from "axios";
import { env } from "@second-brain/env/server";

type QueryLanguage = "sql" | "cypher" | "gremlin";

type ArcadeDbQueryBody = {
  language: QueryLanguage;
  command: string;
};

export function isAlreadyExistsError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const detail = error.response?.data?.detail;
  const normalizedDetail =
    typeof detail === "string" ? detail.toLowerCase() : "";

  return (
    normalizedDetail.includes("already exists") ||
    normalizedDetail.includes("existent index") ||
    normalizedDetail.includes("defined on the properties")
  );
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

  async dropDatabase(): Promise<void> {
    await this.http.post("/server", {
      command: `drop database ${env.ARCADEDB_DATABASE}`,
    });
  }

  async command<T = unknown>(command: string, language: QueryLanguage = "sql"): Promise<T> {
    const body: ArcadeDbQueryBody = { language, command };
    const response = await this.http.post(`/command/${env.ARCADEDB_DATABASE}`, body);

    return response.data as T;
  }

  async query<T = unknown>(query: string, language: QueryLanguage = "sql"): Promise<T> {
    const body: ArcadeDbQueryBody = { language, command: query };
    const response = await this.http.post(`/query/${env.ARCADEDB_DATABASE}`, body);

    return response.data as T;
  }
}

export const arcadeDb = new ArcadeDbClient();
