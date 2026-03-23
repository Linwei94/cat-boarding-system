# 猫咪寄养 🐱

猫咪寄养 & 上门喂养一站式管理系统。PWA，支持添加到 iPhone 主屏幕。

## 功能

- **寄养管理** — 登记入住/退房，记录房型、价格、备注
- **上门喂养** — 记录上门喂养订单及状态
- **预约管理** — 生成一次性预约链接发给客户，客户无需登录即可填写预约表单
- **客户预约表单** — 逐步引导填写主人/猫咪信息、上传护照与疫苗证明、确认注意事项、电子签名
- **数据统计** — 今日/本月/年度收入图表

## 技术栈

- 纯前端（HTML + CSS + ES Modules），无构建步骤
- [Supabase](https://supabase.com) — 数据库、身份验证、文件存储
- PWA — 支持离线缓存、添加到主屏幕

## 部署

### 1. 创建 Supabase 项目

前往 [supabase.com](https://supabase.com) 创建新项目，记录 Project URL 和 anon key。

### 2. 初始化数据库

在 Supabase SQL 编辑器中依次执行：

```
supabase/migrations/20260318120000_booking_tables.sql
supabase/migrations/20260318120001_booking_storage.sql
supabase/migrations/20260318120002_booking_storage_policies.sql
```

或使用 Supabase CLI：

```bash
supabase db push
```

### 3. 配置密钥

编辑 `js/config.js`，填入你的 Supabase URL 和 anon key：

```js
export const SUPABASE_URL  = 'https://xxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```

### 4. 部署静态文件

将整个目录部署到任意静态托管服务（GitHub Pages、Vercel、Nginx 等）。

> **GitHub Pages 示例**：推送到 `main` 分支，在仓库设置中开启 Pages，选择根目录。

## 使用说明

1. 打开网页，注册账号并登录
2. 在「寄养」或「上门」标签中添加订单
3. 在「预约」标签中点击「+ 生成链接」，将链接发给客户
4. 客户通过链接填写预约信息并签字提交，申请自动出现在预约列表中

## 本地预览

无需构建，直接用任意 HTTP 服务器打开：

```bash
npx serve .
# 或
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080`。
