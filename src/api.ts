export interface UsageBucket {
	utilization: number;
	resets_at: string;
}

export interface ExtraUsage {
	is_enabled: boolean;
	monthly_limit: number | null;
	used_credits: number | null;
	utilization: number | null;
}

export interface UsageResponse {
	five_hour: UsageBucket | null;
	seven_day: UsageBucket | null;
	seven_day_oauth_apps: UsageBucket | null;
	seven_day_opus: UsageBucket | null;
	seven_day_sonnet: UsageBucket | null;
	seven_day_cowork: UsageBucket | null;
	iguana_necktie: UsageBucket | null;
	extra_usage: ExtraUsage | null;
}

const API_URL = "https://api.anthropic.com/api/oauth/usage";

export async function fetchUsage(accessToken: string): Promise<UsageResponse> {
	const res = await fetch(API_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"anthropic-beta": "oauth-2025-04-20",
		},
	});
	if (!res.ok) {
		throw new Error(`API request failed: ${res.status} ${res.statusText}`);
	}
	return (await res.json()) as UsageResponse;
}
