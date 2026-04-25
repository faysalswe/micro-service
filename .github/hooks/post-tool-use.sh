#!/bin/bash
# Post-tool-use hook: Auto-format and validate results

set -e

# Read hook input from stdin
input=$(cat)

# Extract tool name and results
tool_name=$(echo "$input" | jq -r '.toolName // empty' 2>/dev/null || echo "")
exit_code=$(echo "$input" | jq -r '.exitCode // 0' 2>/dev/null || echo "0")

# Handle failures and provide context
if [ "$exit_code" != "0" ]; then
  case "$tool_name" in
    "execute")
      # Capture stderr for common issues
      stderr=$(echo "$input" | jq -r '.stderr // empty' 2>/dev/null || echo "")
      
      if echo "$stderr" | grep -q "connection refused" ; then
        echo '{"systemMessage":"Service is not running. Start the cluster with: k3d cluster start"}' >&1
      fi
      
      if echo "$stderr" | grep -q "command not found" ; then
        echo '{"systemMessage":"Tool not installed. Check dependencies with: which <tool>"}' >&1
      fi
      ;;
  esac
fi

# Auto-format YAML files after edits
if [ "$tool_name" = "edit" ]; then
  file_path=$(echo "$input" | jq -r '.parameters.path // empty' 2>/dev/null || echo "")
  
  if [[ "$file_path" == *.yaml ]] || [[ "$file_path" == *.yml ]]; then
    if command -v yamllint &> /dev/null; then
      yamllint -d relaxed "$file_path" > /dev/null 2>&1 || true
    fi
  fi
fi

exit 0
