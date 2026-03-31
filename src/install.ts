import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";

interface ClaudeSettings {
	statusLine?: {
		type: string;
		command: string;
	};
	[key: string]: unknown;
}

interface CcstatusLineWidget {
	id: string;
	type: string;
	commandPath?: string;
	preserveColors?: boolean;
	[key: string]: unknown;
}

interface CcstatusLineSettings {
	version?: number;
	lines?: CcstatusLineWidget[][];
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

function isCcstatusLine(command: string): boolean {
	return command.toLowerCase().includes("ccstatusline");
}

function findQuotaWidgets(settings: CcstatusLineSettings): CcstatusLineWidget[] {
	if (!settings.lines) return [];
	return settings.lines.flat().filter(
		(w) =>
			w.type === "custom-command" &&
			w.commandPath?.includes("claude-quota"),
	);
}

const REMOVED_FLAGS = ["--cache-ttl", "--credentials"];

function cleanCommandPath(commandPath: string): string {
	const parts = commandPath.split(/\s+/);
	const cleaned: string[] = [];
	for (let i = 0; i < parts.length; i++) {
		if (REMOVED_FLAGS.includes(parts[i])) {
			i++; // skip the flag's value
		} else {
			cleaned.push(parts[i]);
		}
	}
	return cleaned.join(" ");
}

function findEmptyLineIndex(settings: CcstatusLineSettings): number {
	if (!settings.lines) return -1;
	return settings.lines.findIndex((line) => line.length === 0);
}

async function installToCcstatusLine(): Promise<boolean> {
	const configPath = join(
		homedir(),
		".config",
		"ccstatusline",
		"settings.json",
	);

	let settings: CcstatusLineSettings;
	try {
		const raw = readFileSync(configPath, "utf-8");
		settings = JSON.parse(raw);
	} catch {
		return false;
	}

	const existingWidgets = findQuotaWidgets(settings);
	if (existingWidgets.length > 0) {
		let updated = false;
		for (const w of existingWidgets) {
			if (w.commandPath) {
				const cleaned = cleanCommandPath(w.commandPath);
				if (cleaned !== w.commandPath) {
					w.commandPath = cleaned;
					updated = true;
				}
			}
		}
		if (updated) {
			writeFileSync(configPath, JSON.stringify(settings, null, 2), "utf-8");
			process.stdout.write("✓ Updated claude-quota widgets in ccstatusline config\n");
		} else {
			process.stdout.write("claude-quota is already in ccstatusline.\n");
		}
		return true;
	}

	const emptyIdx = findEmptyLineIndex(settings);
	if (emptyIdx === -1) {
		process.stdout.write(
			"No empty lines available in ccstatusLine config.\n",
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
			`Add claude-quota to ccstatusLine line ${emptyIdx + 1}?`,
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
		"✓ Added claude-quota to ccstatusLine config\n",
	);
	process.stdout.write("  Restart Claude Code to see the statusLine\n");
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

	// If ccstatusLine is already installed, add as a widget instead
	if (settings.statusLine && isCcstatusLine(settings.statusLine.command)) {
		process.stdout.write(
			"ccstatusLine detected as current statusLine.\n",
		);
		const addWidget = await prompt(
			"Add claude-quota as a ccstatusLine widget?",
		);
		if (addWidget) {
			const installed = await installToCcstatusLine();
			if (installed) return;
		}
		const overwrite = await prompt(
			"Replace ccstatusLine with claude-quota instead?",
		);
		if (!overwrite) {
			process.stdout.write("Installation cancelled.\n");
			return;
		}
	} else if (settings.statusLine) {
		process.stdout.write(
			`Existing statusLine found: ${JSON.stringify(settings.statusLine.command)}\n`,
		);
		const overwrite = await prompt("Overwrite with claude-quota?");
		if (!overwrite) {
			process.stdout.write("Installation cancelled.\n");
			return;
		}
	}

	settings.statusLine = {
		type: "command",
		command: "npx -y claude-quota",
	};

	writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
	process.stdout.write("✓ Installed to ~/.claude/settings.json\n");
	process.stdout.write("  Restart Claude Code to see the statusLine\n");
}
