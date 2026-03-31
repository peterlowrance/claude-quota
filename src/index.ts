import { parseArgs } from "node:util";
import { readStdinHook, extractUsageFromHook, type UsageData } from "./hook.ts";
import { renderBar } from "./bar.ts";
import { formatTimeLeft, computeTimeElapsedPct } from "./format.ts";
import { installToClaudeSettings } from "./install.ts";

const { values } = parseArgs({
	options: {
		"no-block": { type: "boolean", default: false },
		"no-weekly": { type: "boolean", default: false },
		"bar-width": { type: "string", default: "20" },
		verbose: { type: "boolean", short: "v", default: false },
		install: { type: "boolean", default: false },
		help: { type: "boolean", short: "h", default: false },
	},
	strict: true,
});

if (values.help) {
	process.stdout.write(`claude-quota - Claude Code subscription quota statusline

Usage: claude-quota [OPTIONS]

Sections (all enabled by default):
  --no-block           Hide 5-hour block gauge
  --no-weekly          Hide 7-day weekly gauge

Behavior:
  --bar-width <N>      Bar width in characters [default: 20]
  -v, --verbose        Show percentage and time remaining
  --install            Install to ~/.claude/settings.json
  -h, --help           Show this help

Reads rate_limits from Claude Code hook JSON on stdin.
`);
	process.exit(0);
}

const barWidth = Number.parseInt(values["bar-width"]!, 10);
const showBlock = !values["no-block"];
const showWeekly = !values["no-weekly"];
const verbose = values.verbose!;

function render(usage: UsageData): void {
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
	if (values.install) {
		await installToClaudeSettings();
		return;
	}

	const hook = readStdinHook();
	const usage = extractUsageFromHook(hook);
	if (!usage) {
		process.stderr.write("claude-quota: no rate_limits in hook data\n");
		process.exit(1);
	}
	render(usage);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`claude-quota: ${msg}\n`);
	process.exit(1);
});
