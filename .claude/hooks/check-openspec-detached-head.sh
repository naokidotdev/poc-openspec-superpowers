#!/usr/bin/env bash
# PreToolUse(Bash) hook: openspec/ submoduleへの新規コミット前にdetached HEADを検知する。
# CLAUDE.md「openspec/ 配下の操作」の detached HEAD 事故防止ルールを機械的に強制する。

cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)

if printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+-C[[:space:]]+openspec[[:space:]]+(commit|ci)([;&|[:space:]]|$)'; then
  branch=$(git -C openspec branch --show-current 2>/dev/null)
  if [ -z "$branch" ]; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "openspec/ が detached HEAD 状態です。先に `git -C openspec checkout <ブランチ>` で目的のブランチに checkout してください（CLAUDE.md参照）。"
      }
    }'
  else
    echo '{}'
  fi
else
  echo '{}'
fi
