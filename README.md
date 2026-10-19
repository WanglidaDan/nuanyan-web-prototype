# 暖言小站 · 桌面端 UI 原型

lidawang.work「暖言小站」新版桌面端视觉原型（纯静态 HTML/CSS/JS，无后端，数据均为示例）。

- `src/`：当前版本 v1.1，首页信箱 + 玻璃留言卡片（点开背景虚化、居中详情）+ 留言池
- `archive-v1/`：最初的 v1；`archive-v2/`：v2 尝试版（已弃用，保留参考）
- `dist/`：`python3 build.py` 生成的单文件页面，可直接放到任意静态服务器
- `docs/screenshots/`：v1.1 截图

本地预览：`python3 build.py && python3 -m http.server -d dist 8787`，打开 http://localhost:8787
