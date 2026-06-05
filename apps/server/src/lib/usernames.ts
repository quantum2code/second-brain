import fs from "fs/promises";
import path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Platform = "discord" | "slack";

/** Flat map persisted to disk: "platform:userId" → resolved username */
type UsernameCache = Record<string, string>;

// ── Paths ─────────────────────────────────────────────────────────────────────

const CACHE_PATH = path.resolve(process.cwd(), "data", "usernames.json");

// ── Slack API shape (minimal) ─────────────────────────────────────────────────

type SlackUsersInfoResponse = {
  ok: boolean;
  user?: {
    name?: string;
    profile?: {
      display_name?: string;
      real_name?: string;
    };
  };
  error?: string;
};

type SlackProfileResponse = {
  ok: boolean;
  profile?: {
    display_name?: string;
    real_name?: string;
    real_name_normalized?: string;
  };
  error?: string;
};

// ── Resolver ──────────────────────────────────────────────────────────────────

class UsernameResolver {
  private cache: UsernameCache = {};
  private loaded = false;

  // ── Persistence ─────────────────────────────────────────────────────────────

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(CACHE_PATH, "utf-8");
      this.cache = JSON.parse(raw) as UsernameCache;
    } catch {
      // File doesn't exist yet — start empty
      this.cache = {};
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
    await fs.writeFile(CACHE_PATH, JSON.stringify(this.cache, null, 2), "utf-8");
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Resolve a platform user ID to a human-readable username.
   *
   * Resolution order:
   *   1. In-memory cache (fast path)
   *   2. File cache (survives restarts)
   *   3. Platform API call (Slack only — Discord always provides the username)
   *   4. `fallback` if provided, otherwise the raw userId
   */
  async resolve(
    platform: Platform,
    userId: string,
    fallback?: string,
  ): Promise<string> {
    await this.ensureLoaded();

    const key = `${platform}:${userId}`;
    if (this.cache[key]) return this.cache[key];

    const fetched = await this.fetchFromApi(platform, userId);

    if (fetched) {
      // Only cache genuine resolutions — never persist a raw ID fallback so
      // failed lookups are retried on the next message rather than stuck forever.
      this.cache[key] = fetched;
      await this.persist();
      console.log(`[usernames] resolved ${key} → "${fetched}" (API)`);
      return fetched;
    }

    const fallbackName = fallback ?? userId;
    console.warn(`[usernames] could not resolve ${key}, using fallback "${fallbackName}"`);
    return fallbackName;
  }

  /**
   * Directly seed the cache with a known username (e.g. from a Discord message
   * where the username is already present in the event payload).
   * Writes to disk only when the value is new or changed.
   */
  async seed(platform: Platform, userId: string, username: string): Promise<void> {
    await this.ensureLoaded();

    const key = `${platform}:${userId}`;
    if (this.cache[key] === username) return; // nothing changed

    this.cache[key] = username;
    await this.persist();
  }

  // ── Platform API calls ────────────────────────────────────────────────────────

  private async fetchFromApi(
    platform: Platform,
    userId: string,
  ): Promise<string | null> {
    try {
      if (platform === "slack") {
        return await this.fetchSlackUsername(userId);
      }
      // Discord: username always comes from the event payload — no API call needed
    } catch (err) {
      console.warn(`[usernames] API lookup failed for ${platform}:${userId}`, err);
    }
    return null;
  }

  private async fetchSlackUsername(userId: string): Promise<string | null> {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      console.warn("[usernames] SLACK_BOT_TOKEN is not set — cannot resolve Slack usernames");
      return null;
    }

    console.log(`[usernames] fetching Slack username for ${userId}`);

    // ── Attempt 1: users.info (requires users:read scope) ─────────────────────
    const infoRes = await fetch(
      `https://slack.com/api/users.info?user=${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const info = (await infoRes.json()) as SlackUsersInfoResponse;

    if (info.ok && info.user) {
      const name =
        info.user.profile?.display_name?.trim() ||
        info.user.profile?.real_name?.trim() ||
        info.user.name?.trim() ||
        null;
      if (name) {
        console.log(`[usernames] Slack users.info resolved ${userId} → "${name}"`);
        return name;
      }
    }

    if (info.error === "missing_scope") {
      console.warn(
        `[usernames] Slack token missing 'users:read' scope. ` +
        `Add it at https://api.slack.com/apps → OAuth & Permissions → Bot Token Scopes, then reinstall the app.`,
      );
    }

    // ── Attempt 2: users.profile.get (requires users.profile:read scope) ──────
    const profileRes = await fetch(
      `https://slack.com/api/users.profile.get?user=${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const profile = (await profileRes.json()) as SlackProfileResponse;

    if (profile.ok && profile.profile) {
      const name =
        profile.profile.display_name?.trim() ||
        profile.profile.real_name?.trim() ||
        profile.profile.real_name_normalized?.trim() ||
        null;
      if (name) {
        console.log(`[usernames] Slack users.profile.get resolved ${userId} → "${name}"`);
        return name;
      }
    }

    if (profile.error === "missing_scope") {
      console.warn(
        `[usernames] Slack token also missing 'users.profile:read' scope. ` +
        `Add either 'users:read' or 'users.profile:read' to your Slack app.`,
      );
    }

    return null;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let instance: UsernameResolver | null = null;

export function getUsernameResolver(): UsernameResolver {
  if (!instance) instance = new UsernameResolver();
  return instance;
}
