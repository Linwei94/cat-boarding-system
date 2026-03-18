# 阿里嘎多猫咪寄养 — 项目规则

## 版本号规则

版本号存储在 `js/version.js`，格式为 `v1.X`（X 为 build 号）。

**每次 git commit 时，pre-commit hook 自动将 build 号 +1 并 stage `version.js`。**

- 版本号在 app header 展示（手机端标题下方，桌面端 logo 副标题旁）
- 不要手动修改 `js/version.js` 中的版本号
- hook 位于 `.git/hooks/pre-commit`（不进入 git 追踪，新克隆需手动安装：`cp .git/hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`）

### 新环境安装 hook

```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

（如需共享 hook，将 `.git/hooks/pre-commit` 复制到仓库的 `hooks/` 目录并提交）
