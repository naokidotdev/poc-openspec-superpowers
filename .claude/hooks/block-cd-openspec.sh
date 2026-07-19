#!/usr/bin/env bash
# PreToolUse(Bash) hook: openspec/ submoduleへの `cd openspec` 使用を禁止する。
# CLAUDE.md「openspec/ 配下の操作」の cwd 安全性ルールを機械的に強制する。

cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)

if printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])cd[[:space:]]+openspec([;&|[:space:]]|$)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "openspec/ に対して `cd openspec` は使わないでください。`git -C openspec <subcommand>` の形を使ってください（CLAUDE.md参照）。"
    }
  }'
else
  echo '{}'
fi
