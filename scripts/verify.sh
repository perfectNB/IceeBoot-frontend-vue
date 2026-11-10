#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm run test:agent-console
npx --no-install eslint src/api/agentConsole.ts src/pages/admin/agent-console --max-warnings 0
npm run build
