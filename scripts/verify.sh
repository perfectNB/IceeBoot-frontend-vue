#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm run test:agent-console
npm run test:role-authorization
npm run test:user-list
npm run test:theme
npm run test:third-management
npx --no-install eslint src/pages/admin/third src/pages/admin/system/EmailManagement.vue src/pages/admin/system/SmsManagement.vue src/utils/theme.ts src/main.ts src/utils/request.ts src/utils/sse.ts src/api/agentConsole.ts src/pages/admin/agent-console src/api/role.ts src/pages/admin/system/RoleManagement.vue --max-warnings 0
npm run build
