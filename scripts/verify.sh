#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
node --test tests/dashboardMock.test.cjs
npm run test:agent-console
npm run test:role-authorization
npm run test:user-list
npm run test:theme
npm run test:third-management
npx --no-install eslint src --max-warnings 0
npm run build
