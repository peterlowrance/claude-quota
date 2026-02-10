# ccquota

Fast statusline showing Claude Code subscription quota usage — 5-hour block and 7-day weekly limits.

## Installation

No installation needed — use `npx`:

```bash
echo '{}' | npx ccquota
```

Or install globally:

```bash
npm install -g ccquota
echo '{}' | ccquota
```

## Usage

**Basic (default):**

```bash
echo '{}' | ccquota
```

Output: `5h: ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ | 7d: ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`

**Verbose (show percentage and time remaining):**

```bash
echo '{}' | ccquota -v
```

Output: `5h: ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  34% (1h 9m left) | 7d: ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  70% (1d 17h left)`

**Show only one section:**

```bash
echo '{}' | ccquota --no-weekly    # 5-hour block only
echo '{}' | ccquota --no-block     # 7-day weekly only
```

## Claude Code Integration

Configure ccquota as your Claude Code statusline in `~/.claude/settings.json`:

```json
{
  "statusline": {
    "type": "command",
    "command": "ccquota"
  }
}
```

Claude Code pipes session data via stdin — ccquota ignores it and fetches quota data from the Anthropic API using your OAuth credentials (`~/.claude/.credentials.json`).

## How It Works

The bar uses half-block characters (`▀`) to overlay **time elapsed** (top, gray) vs **usage consumed** (bottom, colored):

- **Green**: usage well below time elapsed (ahead of pace)
- **Amber**: usage roughly matches time elapsed (on pace)
- **Red**: usage exceeds time elapsed (behind pace, may hit limit before reset)

Results are cached for 30 seconds by default (configurable via `--cache-ttl`).

## Options

```
--no-block           Hide 5-hour block gauge
--no-weekly          Hide 7-day weekly gauge
--cache-ttl <SECS>   Cache TTL in seconds [default: 30]
--credentials <PATH> Custom credentials file path
--bar-width <N>      Bar width in characters [default: 20]
-v, --verbose        Show percentage and time remaining
-h, --help           Show this help
```

## License

MIT
