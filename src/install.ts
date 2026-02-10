import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";

interface ClaudeSettings {
	statusline?: {
		type: string;
		command: string;
	};
	[key: string]: unknown;
}

interface CcstatuslineWidget {
	id: string;
	type: string;
	commandPath?: string;
	preserveColors?: boolean;
	[key: string]: unknown;
}

interface CcstatuslineSettings {
	version?: number;
	lines?: CcstatuslineWidget[][];
	[key: string]: unknown;
}

async function prompt(question: string): Promise<boolean> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	const answer = await rl.question(`${question} (y/n): `);
	rl.close();
	return answer.toLowerCase() === "y";
}

function isCcstatusline(command: string): boolean {
	return command.includes("ccstatusline");
}

function hasCloudeQuotaWidget(settings: CcstatuslineSettings): boolean {
	if (!settings.lines) return false;
	return settings.lines.some((line) =>
		line.some(
			(w) =>
				w.type === "custom-command" &&
				w.commandPath?.includes("claude-quota"),
		),
	);
}

function findEmptyLineIndex(settings: CcstatuslineSettings): number {
	if (!settings.lines) return -1;
	return settings.lines.findIndex((line) => line.length === 0);
}

async function installToCcstatusline(): Promise<boolean> {
	const configPath = join(
		homedir(),
		".config",
		"ccstatusline",
		"settings.json",
	);

	let settings: CcstatuslineSettings;
	try {
		const raw = readFileSync(configPath, "utf-8");
		settings = JSON.parse(raw);
	} catch {
		return false;
	}

	if (hasCloudeQuotaWidget(settings)) {
		process.stdout.write("claude-quota is already in ccstatusline.\n");
		return true;
	}

	const emptyIdx = findEmptyLineIndex(settings);
	if (emptyIdx === -1) {
		process.stdout.write(
			"No empty lines available in ccstatusline config.\n",
		);
		const addNew = await prompt("Add a new line for claude-quota?");
		if (!addNew) return false;
		settings.lines ??= [];
		settings.lines.push([
			{
				id: "claude-quota",
				type: "custom-command",
				commandPath: "npx -y claude-quota",
				preserveColors: true,
			},
		]);
	} else {
		const ok = await prompt(
			`Add claude-quota to ccstatusline line ${emptyIdx + 1}?`,
		);
		if (!ok) return false;
		settings.lines![emptyIdx] = [
			{
				id: "claude-quota",
				type: "custom-command",
				commandPath: "npx -y claude-quota",
				preserveColors: true,
			},
		];
	}

	writeFileSync(configPath, JSON.stringify(settings, null, 2), "utf-8");
	process.stdout.write(
		"✓ Added claude-quota to ccstatusline config\n",
	);
	process.stdout.write("  Restart Claude Code to see the statusline\n");
	return true;
}

export async function installToClaudeSettings(): Promise<void> {
	const settingsPath = join(homedir(), ".claude", "settings.json");

	let settings: ClaudeSettings = {};
	try {
		const raw = readFileSync(settingsPath, "utf-8");
		settings = JSON.parse(raw);
	} catch {
		mkdirSync(dirname(settingsPath), { recursive: true });
	}

	// If ccstatusline is already installed, add as a widget instead
	if (settings.statusline && isCcstatusline(settings.statusline.command)) {
		process.stdout.write(
			"ccstatusline detected as current statusline.\n",
		);
		const addWidget = await prompt(
			"Add claude-quota as a ccstatusline widget?",
		);
		if (addWidget) {
			const installed = await installToCcstatusline();
			if (installed) return;
		}
		const overwrite = await prompt(
			"Replace ccstatusline with claude-quota instead?",
		);
		if (!overwrite) {
			process.stdout.write("Installation cancelled.\n");
			return;
		}
	} else if (settings.statusline) {
		process.stdout.write(
			`Existing statusline found: ${JSON.stringify(settings.statusline.command)}\n`,
		);
		const overwrite = await prompt("Overwrite with claude-quota?");
		if (!overwrite) {
			process.stdout.write("Installation cancelled.\n");
			return;
		}
	}

	settings.statusline = {
		type: "command",
		command: "npx -y claude-quota",
	};

	writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
	process.stdout.write("✓ Installed to ~/.claude/settings.json\n");
	process.stdout.write("  Restart Claude Code to see the statusline\n");
}
