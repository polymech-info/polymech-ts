PROMPT_CONTEXT=$(cat llm/scripts/context.md)
gemini --allowed-mcp-server-names "poolypress" --approval-mode "auto_edit" -p "$PROMPT_CONTEXT

$1" 