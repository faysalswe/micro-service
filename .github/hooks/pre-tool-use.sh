#!/bin/bash
# Pre-tool-use hook: Validate tool usage and enforce policies

set -e

# Read hook input from stdin
input=$(cat)

# Extract tool name from input
tool_name=$(echo "$input" | jq -r '.toolName // empty' 2>/dev/null || echo "")

# Block dangerous operations
case "$tool_name" in
  "execute")
    # Check if command contains secrets or dangerous patterns
    command=$(echo "$input" | jq -r '.parameters.command // empty' 2>/dev/null || echo "")
    
    if echo "$command" | grep -qE "(password|secret|token|API_KEY)" ; then
      echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Command contains sensitive keywords"}}' >&1
      exit 0
    fi
    
    if echo "$command" | grep -qE "(rm -rf /|sudo|chmod 777)" ; then
      echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Dangerous command requires confirmation"}}' >&1
      exit 0
    fi
    ;;
  "edit")
    # Warn before editing critical files
    file_path=$(echo "$input" | jq -r '.parameters.path // empty' 2>/dev/null || echo "")
    
    if echo "$file_path" | grep -qE "(\.env|\.secret|settings\.json|cluster\.yaml)" ; then
      echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Editing sensitive configuration file"}}' >&1
      exit 0
    fi
    ;;
esac

# Default: allow
exit 0
