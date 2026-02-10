# claude-quota

Fast statusline showing Claude Code subscription quota usage — 5-hour block and 7-day weekly limits.

## Usage

Add to `~/.claude/settings.json`:

```json
{
  "statusline": {
    "type": "command",
    "command": "npx claude-quota"
  }
}
```

**Default output:**

![claude-quota default output showing 5h and 7d bars](./images/claude-quota-5h.png)

**Verbose mode (show percentage and time remaining):**

```json
{
  "statusline": {
    "type": "command",
    "command": "npx claude-quota -v"
  }
}
```

![claude-quota verbose output with percentages and time](./images/claude-quota-verbose.png)

## ccstatusline Integration

Use as a Custom Command Widget with [ccstatusline](https://github.com/sirmalloc/ccstatusline). Enable "preserve colors" in your widget config.

![claude-quota in ccstatusline](./images/claude-quota-ccstatusline.png)

## Installation

Optional — install globally to avoid npx overhead:

```bash
npm install -g claude-quota
```

Then use `"command": "claude-quota"` in settings.json.

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
