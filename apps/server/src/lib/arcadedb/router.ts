import { Router } from "express";
import { z } from "zod";
import { arcadeDb } from "./client";
import { initializeArcadeDb } from "./init";

const commandSchema = z.object({
  command: z.string().min(1),
});

const querySchema = z.object({
  query: z.string().min(1),
});

export const arcadedbRouter: Router = Router();

arcadedbRouter.post("/setup", async (_req, res, next) => {
  try {
    await initializeArcadeDb();
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

arcadedbRouter.post("/command", async (req, res, next) => {
  try {
    const parsed = commandSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { command } = parsed.data;
    const result = await arcadeDb.command(command);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

arcadedbRouter.post("/query", async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { query } = parsed.data;
    const result = await arcadeDb.query(query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
