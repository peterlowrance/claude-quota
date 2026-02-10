import { readFileSync } from "node:fs";

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
