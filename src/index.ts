import { parseArgs } from "node:util";
import { readAccessToken } from "./credentials.ts";
import { readStdinHook } from "./hook.ts";
import { fetchUsage, type UsageResponse } from "./api.ts";
import { readCache, writeCache } from "./cache.ts";
import { renderBar } from "./bar.ts";
import { formatTimeLeft, computeTimeElapsedPct } from "./format.ts";

const { values } = parseArgs({
	options: {
		"no-block": { type: "boolean", default: false },
		"no-weekly": { type: "boolean", default: false },
		"cache-ttl": { type: "string", default: "30" },
		credentials: { type: "string" },
		"bar-width": { type: "string", default: "20" },
		verbose: { type: "boolean", short: "v", default: false },
		help: { type: "boolean", short: "h", default: false },
	},
	strict: true,
});

if (values.help) {
	process.stdout.write(`ccquota - Claude Code subscription quota statusline

Usage: ccquota [OPTIONS]

Sections (all enabled by default):
  --no-block           Hide 5-hour block gauge
  --no-weekly          Hide 7-day weekly gauge

Behavior:
  --cache-ttl <SECS>   Cache TTL in seconds [default: 30]
  --credentials <PATH> Custom credentials file path
  --bar-width <N>      Bar width in characters [default: 20]
  -v, --verbose        Show percentage and time remaining
  -h, --help           Show this help

Reads Claude Code hook JSON from stdin.
`);
	process.exit(0);
}

const cacheTtl = Number.parseInt(values["cache-ttl"]!, 10);
const barWidth = Number.parseInt(values["bar-width"]!, 10);
const showBlock = !values["no-block"];
const showWeekly = !values["no-weekly"];
const verbose = values.verbose!;

// Read stdin hook data (non-blocking, we just need it to not crash)
readStdinHook();

async function getUsage(): Promise<UsageResponse> {
	const cached = readCache(cacheTtl);
	if (cached) return cached;

	const token = readAccessToken(values.credentials);
	const usage = await fetchUsage(token);
	writeCache(usage);
	return usage;
}

function render(usage: UsageResponse): void {
	const sections: string[] = [];

	if (showBlock && usage.five_hour) {
		const { utilization, resets_at } = usage.five_hour;
		const timePct = computeTimeElapsedPct(resets_at, 5);
		const bar = renderBar(timePct, utilization, barWidth);
		let s = `5h: ${bar}`;
		if (verbose) {
			s += `  ${Math.round(utilization)}% (${formatTimeLeft(resets_at)})`;
		}
		sections.push(s);
	}

	if (showWeekly && usage.seven_day) {
		const { utilization, resets_at } = usage.seven_day;
		const timePct = computeTimeElapsedPct(resets_at, 7 * 24);
		const bar = renderBar(timePct, utilization, barWidth);
		let s = `7d: ${bar}`;
		if (verbose) {
			s += `  ${Math.round(utilization)}% (${formatTimeLeft(resets_at)})`;
		}
		sections.push(s);
	}

	if (sections.length > 0) {
		process.stdout.write(sections.join(" | ") + "\n");
	}
}

async function main(): Promise<void> {
	const usage = await getUsage();
	render(usage);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`ccquota: ${msg}\n`);
	process.exit(1);
});
