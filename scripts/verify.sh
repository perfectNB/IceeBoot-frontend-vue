#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm run test:agent-console
npm run test:role-authorization
npx --no-install eslint src/api/agentConsole.ts src/pages/admin/agent-console src/api/role.ts src/pages/admin/system/RoleManagement.vue --max-warnings 0
npm run build
