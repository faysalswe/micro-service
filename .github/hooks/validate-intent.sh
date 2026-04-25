#!/bin/bash
# Validate prompt intent and route to appropriate agent

set -e

# Read hook input from stdin
input=$(cat)

# Extract user message
user_message=$(echo "$input" | jq -r '.userMessage // empty' 2>/dev/null || echo "")

# Route based on keywords
if echo "$user_message" | grep -qiE "(latency|trace|jaeger|prometheus|metric|performance|slow)" ; then
  echo '{"systemMessage":"Consider using the SRE & Observability agent for this task. Type: @sre-observability"}' >&1
fi

if echo "$user_message" | grep -qiE "(helm|kubernetes|k3s|k3d|deployment|ingress|pod|cluster)" ; then
  echo '{"systemMessage":"Consider using the Platform Engineer agent for this task. Type: @platform-engineer"}' >&1
fi

if echo "$user_message" | grep -qiE "(api|service|grpc|rest|microservice|endpoint|protocol buffer|test)" ; then
  echo '{"systemMessage":"Consider using the Microservices Developer agent for this task. Type: @microservices-developer"}' >&1
fi

exit 0
