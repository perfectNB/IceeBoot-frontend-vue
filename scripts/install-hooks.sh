#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
current=$(git config --get core.hooksPath || true)
if [ -n "$current" ] && [ "$current" != '.githooks' ]; then
    echo "已有 hooksPath=$current，请将本项目检查接入现有钩子。" >&2
    exit 1
fi
git config core.hooksPath .githooks
echo '已启用提交检查和推送前前端验证。'
