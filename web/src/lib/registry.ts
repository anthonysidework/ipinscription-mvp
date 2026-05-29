/**
 * App-operated registry index (server-side).
 *
 * Bitcoin has no contract state, so to power Explore + Verify-by-hash we keep our
 * own index of inscriptions made through the app. Two drivers:
 *   - Upstash Redis (KV)  — used automatically on Vercel when env vars are set.
 *   - Local JSON file     — used in development (no external service needed).
 *
 * The inscriptions are still real and on-chain; this only makes them searchable.
 */
import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { InscriptionRecord, AddRecordInput } from "./types";

const HASH_KEY = (h: string) => `ip:hash:${h.toLowerCase()}`;
const RECORD_KEY = (id: number) => `ip:rec:${id}`;
const COUNT_KEY = "ip:count";
const OWNER_KEY = (o: string) => `ip:owner:${o.toLowerCase()}`;

interface RegistryDriver {
  add(input: AddRecordInput): Promise<InscriptionRecord>;
  getByHash(hash: string): Promise<InscriptionRecord | null>;
  getById(id: number): Promise<InscriptionRecord | null>;
  total(): Promise<number>;
  /** Newest-first page of records. */
  list(offset: number, limit: number): Promise<InscriptionRecord[]>;
  listByOwner(owner: string): Promise<InscriptionRecord[]>;
}

/* --------------------------- Upstash KV driver -------------------------- */

class KvDriver implements RegistryDriver {
  private redis: Redis;

  constructor() {
    this.redis = Redis.fromEnv();
  }

  async add(input: AddRecordInput): Promise<InscriptionRecord> {
    const existing = await this.getByHash(input.contentHash);
    if (existing) return existing;

    const id = ((await this.redis.incr(COUNT_KEY)) as number) - 1;
    const record: InscriptionRecord = {
      ...input,
      id,
      timestamp: Math.floor(Date.now() / 1000),
    };
    await Promise.all([
      this.redis.set(RECORD_KEY(id), record),
      this.redis.set(HASH_KEY(input.contentHash), id),
      this.redis.rpush(OWNER_KEY(input.owner), id),
    ]);
    return record;
  }

  async getByHash(hash: string): Promise<InscriptionRecord | null> {
    const id = await this.redis.get(HASH_KEY(hash));
    if (id === null || id === undefined) return null;
    return this.getById(Number(id));
  }

  async getById(id: number): Promise<InscriptionRecord | null> {
    const rec = await this.redis.get<InscriptionRecord>(RECORD_KEY(id));
    return rec ?? null;
  }

  async total(): Promise<number> {
    const c = await this.redis.get<number>(COUNT_KEY);
    return c ? Number(c) : 0;
  }

  async list(offset: number, limit: number): Promise<InscriptionRecord[]> {
    const count = await this.total();
    const out: InscriptionRecord[] = [];
    const start = count - 1 - offset; // newest first
    for (let i = start; i > start - limit && i >= 0; i--) {
      const rec = await this.getById(i);
      if (rec) out.push(rec);
    }
    return out;
  }

  async listByOwner(owner: string): Promise<InscriptionRecord[]> {
    const ids = ((await this.redis.lrange(OWNER_KEY(owner), 0, -1)) ?? []) as (
      | number
      | string
    )[];
    const recs = await Promise.all(ids.map((i) => this.getById(Number(i))));
    return recs
      .filter((r): r is InscriptionRecord => !!r)
      .sort((a, b) => b.id - a.id);
  }
}

/* ---------------------------- file driver ------------------------------ */

type FileShape = { records: InscriptionRecord[] };

class FileDriver implements RegistryDriver {
  private file = path.join(process.cwd(), ".registry", "registry.json");

  private async read(): Promise<FileShape> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      return JSON.parse(raw) as FileShape;
    } catch {
      return { records: [] };
    }
  }

  private async write(data: FileShape): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(data, null, 2), "utf8");
  }

  async add(input: AddRecordInput): Promise<InscriptionRecord> {
    const data = await this.read();
    const existing = data.records.find(
      (r) => r.contentHash.toLowerCase() === input.contentHash.toLowerCase()
    );
    if (existing) return existing;

    const record: InscriptionRecord = {
      ...input,
      id: data.records.length,
      timestamp: Math.floor(Date.now() / 1000),
    };
    data.records.push(record);
    await this.write(data);
    return record;
  }

  async getByHash(hash: string): Promise<InscriptionRecord | null> {
    const data = await this.read();
    return (
      data.records.find(
        (r) => r.contentHash.toLowerCase() === hash.toLowerCase()
      ) ?? null
    );
  }

  async getById(id: number): Promise<InscriptionRecord | null> {
    const data = await this.read();
    return data.records[id] ?? null;
  }

  async total(): Promise<number> {
    return (await this.read()).records.length;
  }

  async list(offset: number, limit: number): Promise<InscriptionRecord[]> {
    const data = await this.read();
    return [...data.records].reverse().slice(offset, offset + limit);
  }

  async listByOwner(owner: string): Promise<InscriptionRecord[]> {
    const data = await this.read();
    return data.records
      .filter((r) => r.owner.toLowerCase() === owner.toLowerCase())
      .sort((a, b) => b.id - a.id);
  }
}

/* ----------------------------- selection ------------------------------- */

let singleton: RegistryDriver | null = null;

export function usingKv(): boolean {
  return (
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function registry(): RegistryDriver {
  if (singleton) return singleton;
  singleton = usingKv() ? new KvDriver() : new FileDriver();
  return singleton;
}
