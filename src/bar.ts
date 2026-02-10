const HALF_BLOCK = "\u2580"; // ▀ — fg on top, bg on bottom

// ANSI 256-color helpers
const fg = (c: number) => `\x1b[38;5;${c}m`;
const bg = (c: number) => `\x1b[48;5;${c}m`;
const reset = "\x1b[0m";

// Color palette
const TIME_COLOR = 245; // subtle lighter gray (top half)
const EMPTY_BG = 236; // dark gray (unfilled)
const USAGE_GREEN = 71; // muted teal-green (ahead)
const USAGE_AMBER = 172; // warm amber (on pace)
const USAGE_RED = 167; // muted coral-red (behind)

function usageColor(timePct: number, usagePct: number): number {
	if (timePct <= 0) {
		return usagePct > 0 ? USAGE_RED : USAGE_GREEN;
	}
	const ratio = usagePct / timePct;
	if (ratio < 0.8) return USAGE_GREEN;
	if (ratio <= 1.2) return USAGE_AMBER;
	return USAGE_RED;
}

export function renderBar(
	timePct: number,
	usagePct: number,
	width: number,
): string {
	const timeFill = Math.round((Math.min(Math.max(timePct, 0), 100) / 100) * width);
	const usageFill = Math.round((Math.min(Math.max(usagePct, 0), 100) / 100) * width);
	const uColor = usageColor(timePct, usagePct);

	let bar = "";
	for (let i = 0; i < width; i++) {
		const hasTime = i < timeFill;
		const hasUsage = i < usageFill;

		if (hasTime && hasUsage) {
			// Both filled: fg=time color (top), bg=usage color (bottom)
			bar += `${fg(TIME_COLOR)}${bg(uColor)}${HALF_BLOCK}`;
		} else if (hasTime) {
			// Time only: fg=time color (top), bg=dark gray (bottom)
			bar += `${fg(TIME_COLOR)}${bg(EMPTY_BG)}${HALF_BLOCK}`;
		} else if (hasUsage) {
			// Usage only: fg=dark gray (top), bg=usage color (bottom)
			bar += `${fg(EMPTY_BG)}${bg(uColor)}${HALF_BLOCK}`;
		} else {
			// Empty: space with dark gray bg
			bar += `${bg(EMPTY_BG)} `;
		}
	}
	bar += reset;
	return bar;
}
