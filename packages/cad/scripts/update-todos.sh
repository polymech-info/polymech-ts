kbotd modify \
    --prompt="./scripts/todos.md" \
    --router2=openai \
    --model=anthropic/claude-3.7-sonnet:thinking \
    --include2="src/commands/run.ts" \
    --include2="src/zod_schema.ts" \
    --include2="src/client.ts" \
    --disable="npm,terminal,git,user,search,email,web,interact" \
    --disableTools="file_exists,list_files,read_files" \
    --dst="./.kbot/todos-log.md"
