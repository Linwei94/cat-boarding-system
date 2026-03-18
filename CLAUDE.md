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

## iOS 设计规则

### 安全区域 / 灵动岛
- **顶部**：`env(safe-area-inset-top)` 必须加入所有 fixed/sticky 顶部元素（header、modal-hero 区、浮动按钮）
- **底部**：所有底部 sticky 元素（`.modal-footer`、`.bd-footer`、`.bottom-nav`）必须使用 `padding-bottom: max(Xpx, env(safe-area-inset-bottom))`
- **绝对定位元素**靠近边缘时：用 `left: max(12px, env(safe-area-inset-left))` 等形式避免被系统 UI 遮挡
- 灵动岛机型（iPhone 14 Pro 起）：`safe-area-inset-top` ≈ 59px；普通刘海 ≈ 44px；无刘海 ≈ 0

### Modal / Bottom Sheet
- 移动端 modal 从底部滑入，用 `border-radius: 24px 24px 0 0`；顶部加 drag handle（`::before` 伪元素，36×4px 圆角灰条）
- 桌面端 modal 居中弹出，`border-radius: 24px`
- **Modal 内容分组**：使用 `.modal-grouped` 类将 modal-content 背景改为 `var(--bg)`（暖米色），内部白色卡片显 `.bd-rows`/`.detail-info-grid`——这避免"白底+白卡"的双层白视觉问题
- 永远不要让 overlay 在 swipe-to-dismiss 拖拽中淡出——会露出白色 app 背景
- Overscroll（iOS 弹性滚动）：modal-content 加 `overscroll-behavior: contain` 防止穿透到下层

### 按钮 / 点击态
- 所有可点击元素必须设 `-webkit-tap-highlight-color: transparent`
- 活跃态用 `opacity` + `transform: scale(0.97–0.98)` 模拟 iOS 按压反馈
- 底部 Action 按钮（主操作）用全宽、16px 字号、700 字重、14px border-radius；主按钮加渐变+阴影

### 分组信息列表（iOS Settings 风格）
- 用 `.bd-rows` 容器 + `.bd-row` 行：label 左（固定宽度）+ value 右对齐
- 行间用 1px `var(--border)` 分割线，最后一行不加
- 行容器用 `border-radius: 14px; overflow: hidden` 一次裁切所有圆角，不要给每行单独设圆角
- Section 标题用全大写 12px、`color: var(--text-light)`、`letter-spacing: 0.04em`
