export function formatTimeLeft(resetsAt: string): string {
	const now = Date.now();
	const reset = new Date(resetsAt).getTime();
	let diffMs = reset - now;

	if (diffMs <= 0) return "resetting";

	const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	diffMs %= 1000 * 60 * 60 * 24;
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	diffMs %= 1000 * 60 * 60;
	const minutes = Math.floor(diffMs / (1000 * 60));

	if (days > 0) return `${days}d ${hours}h left`;
	if (hours > 0) return `${hours}h ${minutes}m left`;
	return `${minutes}m left`;
}

export function computeTimeElapsedPct(
	resetsAt: string,
	totalDurationHours: number,
): number {
	const now = Date.now();
	const reset = new Date(resetsAt).getTime();
	const remainingMs = reset - now;
	const totalMs = totalDurationHours * 60 * 60 * 1000;
	const elapsedMs = totalMs - remainingMs;
	return Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));
}
