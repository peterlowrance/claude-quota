import { readFileSync } from "node:fs";

interface RateLimitPeriod {
	used_percentage?: number | null;
	resets_at?: number | null; // Unix epoch seconds
}

export interface HookData {
	session_id?: string;
	transcript_path?: string;
	cwd?: string;
	model?: {
		id?: string;
		display_name?: string;
	};
	version?: string;
	cost?: {
		total_cost_usd?: number;
	};
	context_window?: {
		total_input_tokens?: number;
		total_output_tokens?: number;
		context_window_size?: number;
	};
	rate_limits?: {
		five_hour?: RateLimitPeriod;
		seven_day?: RateLimitPeriod;
	} | null;
}

export interface UsageData {
	five_hour: { utilization: number; resets_at: string } | null;
	seven_day: { utilization: number; resets_at: string } | null;
}

function epochToIso(epoch: number | null | undefined): string | null {
	if (epoch === null || epoch === undefined || !Number.isFinite(epoch)) {
		return null;
	}
	return new Date(epoch * 1000).toISOString();
}

export function extractUsageFromHook(hook: HookData): UsageData | null {
	const rl = hook.rate_limits;
	if (!rl) return null;

	let five_hour: UsageData["five_hour"] = null;
	let seven_day: UsageData["seven_day"] = null;

	if (rl.five_hour?.used_percentage != null) {
		const resets_at = epochToIso(rl.five_hour.resets_at);
		if (resets_at) {
			five_hour = { utilization: rl.five_hour.used_percentage, resets_at };
		}
	}

	if (rl.seven_day?.used_percentage != null) {
		const resets_at = epochToIso(rl.seven_day.resets_at);
		if (resets_at) {
			seven_day = { utilization: rl.seven_day.used_percentage, resets_at };
		}
	}

	if (!five_hour && !seven_day) return null;
	return { five_hour, seven_day };
}

export function readStdinHook(): HookData {
	try {
		const raw = readFileSync(0, "utf-8");
		if (!raw.trim()) return {};
		return JSON.parse(raw) as HookData;
	} catch {
		return {};
	}
}
