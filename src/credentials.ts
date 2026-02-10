import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface CredentialsFile {
	claudeAiOauth?: {
		accessToken?: string;
		refreshToken?: string;
		expiresAt?: number;
		subscriptionType?: string;
		rateLimitTier?: string;
	};
}

export function readAccessToken(credentialsPath?: string): string {
	const filePath =
		credentialsPath ?? join(homedir(), ".claude", ".credentials.json");
	const raw = readFileSync(filePath, "utf-8");
	const data: CredentialsFile = JSON.parse(raw);
	const token = data.claudeAiOauth?.accessToken;
	if (!token) {
		throw new Error(
			`No accessToken found in ${filePath} under claudeAiOauth`,
		);
	}
	return token;
}
