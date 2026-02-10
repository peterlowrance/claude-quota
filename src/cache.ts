import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { UsageResponse } from "./api.ts";

interface CacheEntry {
	timestamp: number;
	data: UsageResponse;
}

const CACHE_PATH = join(tmpdir(), "claude-quota-cache.json");

export function readCache(ttlSeconds: number): UsageResponse | null {
	try {
		const raw = readFileSync(CACHE_PATH, "utf-8");
		const entry: CacheEntry = JSON.parse(raw);
		const age = (Date.now() - entry.timestamp) / 1000;
		if (age < ttlSeconds) {
			return entry.data;
		}
	} catch {
		// Cache miss or corrupt
	}
	return null;
}

export function writeCache(data: UsageResponse): void {
	try {
		const entry: CacheEntry = { timestamp: Date.now(), data };
		writeFileSync(CACHE_PATH, JSON.stringify(entry), "utf-8");
	} catch {
		// Best-effort caching
	}
}
