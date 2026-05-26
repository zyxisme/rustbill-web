<p align="center">
  <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#090c10" />
    <path d="M8 22V12L16 8L24 12V22L16 26L8 22Z" stroke="#00d1a7" strokeWidth="1.5" fill="none" />
    <circle cx="16" cy="17" r="3" fill="#00d1a7" />
  </svg>
</p>

<h1 align="center">RustBill · Consumer</h1>

<p align="center">
  客户前台 SPA — 产品浏览、下单购买、实例管理、工单支持
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-19-58a6ff?style=for-the-badge&logo=react&labelColor=%230e1b18" alt="React 19">
  <img src="https://img.shields.io/badge/typescript-6-3178c6?style=for-the-badge&logo=typescript&labelColor=%230e1b18" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/vite-8-646cff?style=for-the-badge&logo=vite&labelColor=%230e1b18" alt="Vite 8">
  <img src="https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=for-the-badge&logo=shadcnui&labelColor=%230e1b18" alt="shadcn/ui">
  <img src="https://img.shields.io/badge/tailwind-4-06b6d4?style=for-the-badge&logo=tailwindcss&labelColor=%230e1b18" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/i18n-zh_CN%20%7C%20en_US-00d1a7?style=for-the-badge&labelColor=%230e1b18" alt="i18n">
</p>

---

## 特性

- **18 个页面** — IDC 营销主页 + 产品目录 + 用户 Dashboard（订单/实例/账单/工单/余额/API Key/设置）
- **Dark-Teal-Design** — `#0e1b18` 底色 · `#00d1a7` teal accent · Inter UI + JetBrains Mono 字体
- **国际化** — zh-CN / en-US 双语言，~350 个翻译键，运行时切换零延迟
- **品牌定制** — `brand.yaml` 驱动从 accent 色自动推导 34 色调色板，全站 CSS 变量注入
- **点阵世界地图** — dotted-map SVG 懒加载，6 个集群节点可视化
- **响应式布局** — 移动端 sidebar overlay + 汉堡菜单 + 表格自适应 + iOS 安全区
- **Vike SSG** — 静态站点生成，3 页面构建时渲染完整 HTML，自带 SEO meta 标签
- **SEO 完整** — 静态 `<title>`/`<meta description>`/OG/Twitter Card/JSON-LD 结构化数据 + sitemap
- **自定义动画** — 纯 CSS shimmer / 骨架屏 / 滚动入场 / 交错列表 / 页面过渡
- **法律条款** — Terms / Privacy 页面，Markdown 编译时嵌入，双语版本

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript 6 |
| 构建 | Vite 8 |
| UI 原语 | Radix UI (13 个无样式行为组件) |
| 样式 | Tailwind CSS 4 + CVA |
| 路由 | Vike (文件系统 SSG) + React Router 7 (Dashboard 内部) |
| 状态管理 | Zustand 5 |
| 图标 | Lucide React |
| 国际化 | i18next + react-i18next |
| gRPC-Web | 手写协议层 (proto-codec + proto-defs + grpc-client) |
| Markdown | marked (法律条款编译时渲染) |
| 地图 | dotted-map (点阵 SVG) |
| 安全 | DOMPurify (XSS 防护) |
| 字体 | HarmonyOS Sans Webfont (按需分割加载) |

## 项目结构

```
web-consumer/
├── pages/                    # Vike 文件系统路由 (SSG)
│   ├── +config.ts            #   全局 Vike 配置 (extends vikeReact)
│   ├── +Layout.tsx           #   根布局 (HelmetProvider + i18n + ErrorBoundary)
│   ├── +client.ts            #   客户端入口 (字体异步加载)
│   ├── index/
│   │   ├── +Page.tsx         #   主页 → "/" (SSG, 完整静态 HTML)
│   │   ├── +Head.tsx         #   SEO meta (title/description/OG/JSON-LD)
│   │   └── +config.ts        #   prerender: true
│   ├── catalog/
│   │   ├── +Page.tsx         #   产品目录 → "/catalog" (CSR + helmet)
│   │   └── @id/
│   │       ├── +Page.tsx     #   产品详情 → "/catalog/:id" (CSR + helmet)
│   │       └── +config.ts    #   prerender: false
│   ├── login/
│   │   └── +Page.tsx         #   登录 → "/login" (CSR)
│   ├── register/
│   │   └── +Page.tsx         #   注册 → "/register" (CSR)
│   ├── legal/
│   │   ├── terms/
│   │   │   ├── +Page.tsx     #   用户协议 → "/legal/terms" (SSG)
│   │   │   ├── +Head.tsx     #   SEO meta
│   │   │   └── +config.ts    #   prerender: true
│   │   └── privacy/
│   │       ├── +Page.tsx     #   隐私政策 → "/legal/privacy" (SSG)
│   │       ├── +Head.tsx     #   SEO meta
│   │       └── +config.ts    #   prerender: true
│   └── dashboard/
│       ├── +Page.tsx         #   Dashboard shell (CSR, 内部 react-router)
│       └── +config.ts        #   ssr: false, prerender: true
├── src/
│   ├── api/                  # gRPC-Web 客户端层
│   │   ├── grpc-client.ts    #   JWT 管理 + 自动刷新 + 跨域 preconnect
│   │   ├── proto-codec.ts    #   protobuf 编解码
│   │   └── proto-defs.ts     #   MessageDef 定义 (与 .proto 同步)
│   ├── components/
│   │   ├── ui/               #   shadcn/ui 组件 (19 个)
│   │   ├── DashboardApp.tsx  #   Dashboard SPA (BrowserRouter + 11 子路由)
│   │   ├── PageLoader.tsx    #   品牌 Logo 脉冲 + 微光进度条
│   │   ├── LazyWorldMap.tsx  #   点阵世界地图 (IntersectionObserver)
│   │   ├── LazyTerminal.tsx  #   终端展示组件 (懒加载)
│   │   ├── HomeHero.tsx      #   主页 Hero 区块
│   │   ├── NavMenu.tsx       #   递归导航菜单
│   │   ├── SidebarNav.tsx    #   Dashboard 侧边栏
│   │   ├── StatusTag.tsx     #   5 组状态常量映射
│   │   ├── SafeHtml.tsx      #   DOMPurify XSS 安全渲染
│   │   ├── FadeIn.tsx        #   IntersectionObserver 滚动入场
│   │   ├── StaggerList.tsx   #   交错动画列表
│   │   └── ErrorBoundary.tsx #   chunk 加载失败兜底
│   ├── pages/
│   │   ├── Home.tsx          #   主页 (12 区块 IDC 营销页)
│   │   ├── Catalog.tsx       #   产品目录 (三级导航)
│   │   ├── ProductDetail.tsx #   产品详情 + 下单
│   │   ├── Login.tsx         #   登录 (JWT)
│   │   ├── Register.tsx      #   注册
│   │   ├── legal/            #   法律条款 (Terms + Privacy)
│   │   └── dashboard/        #   用户中心 (11 页)
│   ├── layouts/
│   │   ├── PublicLayout.tsx  #   顶栏 + 内容 + Footer
│   │   └── DashboardLayout.tsx # 侧边栏 (240px) + 内容
│   ├── stores/
│   │   └── auth.ts           #   Zustand auth store (单一职责)
│   ├── seo.ts                #   SEO meta 工厂函数
│   ├── i18n-server.ts        #   SSR 安全 i18n (构建时无 browser detector)
│   ├── locales/
│   │   ├── zh-CN/            #   ~350 键
│   │   └── en-US/            #   ~350 键
│   ├── assets/
│   │   └── map-data.json     #   地图坐标数据 (构建脚本生成)
│   ├── vite-plugin-brand.ts  #   brand.yaml → CSS 变量 + 虚拟模块
│   ├── vite-plugin-markdown-html.ts # Markdown → HTML 编译时转换
│   └── i18n.ts               #   i18next 初始化 + 当前语言懒加载
├── public/
│   ├── favicon.svg
│   ├── robots.txt            #   爬虫规则 + sitemap 指向
│   └── config.json           #   运行时配置 (gRPC endpoint / 标题)
├── scripts/
│   ├── gen-map-data.mjs      #   地图坐标数据生成
│   └── gen-sitemap.mjs       #   sitemap.xml 生成
├── brand.yaml                #   品牌配置 (名称/Logo/导航/颜色/集群)
├── vite.config.ts
└── package.json
```

## 页面清单 (18 页)

### 公开页面

| 页面 | 路径 | 说明 |
|------|------|------|
| Home | `/` | IDC 级营销主页，12 区块 (Hero/Feature/Infra/Pricing/FAQ...) |
| Catalog | `/catalog` | 三级导航 — 左侧 Category → 上方 Group 卡片 → 下方 Product 网格 |
| ProductDetail | `/catalog/:id` | 规格/Markdown 描述/计费周期/网关选择/下单 |
| Login | `/login` | 用户名 + 密码 → JWT |
| Register | `/register` | 用户名 + 邮箱 + 密码 |
| Terms | `/legal/terms` | 用户服务协议 (Markdown 编译时渲染，双语) |
| Privacy | `/legal/privacy` | 隐私政策 (Markdown 编译时渲染，双语) |

### Dashboard 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| Overview | `/dashboard` | 余额/订单/实例统计卡 + 快捷操作 |
| MyOrders | `/dashboard/orders` | 订单列表 + 分页 |
| OrderDetail | `/dashboard/orders/:id` | 详情 + 支付 + 支付记录 |
| MyInstances | `/dashboard/instances` | 实例列表 |
| InstanceDetail | `/dashboard/instances/:id` | 详情 + 插件自定义 section/iframe + 启停重启销毁 |
| MyInvoices | `/dashboard/invoices` | 账单列表 |
| MyTickets | `/dashboard/tickets` | 工单列表 + 新建弹窗 |
| TicketDetail | `/dashboard/tickets/:id` | 详情 + 回复 (过滤内部备注) + 发送回复 |
| MyBalance | `/dashboard/balance` | 余额 + 充值弹窗 (选网关) + 交易流水 |
| Settings | `/dashboard/settings` | 个人信息 + 修改密码 |
| ApiKeys | `/dashboard/api-keys` | API Key 创建/轮换/吊销 |

## 快速开始

```bash
cd web-consumer

# 安装依赖
npm install

# 启动开发服务器 (http://localhost:3000)
npm run dev

# TypeScript 类型检查
npx tsc -p tsconfig.app.json --noEmit

# 生产构建 (TS 检查 + Vike SSG 预渲染)
npm run build

# 预览生产构建
npm run preview

# 生成 sitemap (替换 SITE_URL 为实际域名)
SITE_URL=https://example.com npm run gen-sitemap
```

开发服务器自动代理 gRPC 请求到 `localhost:50051`。确保后端 `rustbill-server` 已启动。

### 构建输出

`npm run build` 生成 `dist/client/`，每个路由一个 HTML 文件：

```
dist/client/
├── index.html              # Home — 完整静态 HTML + SEO meta
├── catalog/index.html      # Catalog — CSR shell
├── login/index.html        # Login — CSR
├── register/index.html     # Register — CSR
├── dashboard/index.html    # Dashboard shell (内部 react-router)
└── legal/
    ├── terms/index.html    # Terms — 完整静态 HTML
    └── privacy/index.html  # Privacy — 完整静态 HTML
```

## 运行时配置

`public/config.json` 控制运行时行为：

```json
{
  "endpoints": [""],
  "appTitle": "RustBill",
  "adminUrl": "/admin"
}
```

| 字段 | 说明 |
|------|------|
| `endpoints` | gRPC 端点列表 (空字符串 = 同源，也可填 `https://api.example.com`) |
| `appTitle` | 浏览器标题 |
| `adminUrl` | 管理后台跳转链接 |

部署时修改此文件，无需重新构建。

## 品牌定制

编辑 `brand.yaml` 即可改品牌名、Logo、强调色、导航、集群节点：

```yaml
brandName: "RustBill"
tagline: "高性能云计算平台"
accent: "#00d1a7"          # 从 accent 自动推导 34 色调色板

logo:
  type: "svg"
  svg: |
    <svg>...</svg>

# 顶栏导航 (支持二级下拉)
header:
  nav:
    - i18n: "nav.home"
      href: "/"

# Dashboard 侧边栏 (lucide 图标名)
sidebar:
  nav:
    - i18n: "nav.overview"
      href: "/dashboard"
      icon: "LayoutDashboard"

# 世界地图集群节点
clusters:
  - id: "us-west"
    name: "美国西部"
    lat: 37.0
    lng: -122.0
    zones: 3
    latency: "< 10ms"
```

构建时 `vite-plugin-brand.ts` 读取 `brand.yaml` → 注入 CSS 变量到 `<head>` + 生成 `virtual:brand` ESM 模块。

## 部署

`npm run build` 输出静态文件到 `dist/client/`，部署到任意静态文件服务。

每个路由有独立的 HTML 文件（非 SPA 单 index.html），因此无需全局 `try_files` 回退。**例外**：Dashboard 子路由（`/dashboard/orders` 等）由内部 react-router 处理，需要 SPA fallback。

### Caddy

```caddy
example.com {
    root * /var/www/rustbill-consumer

    # Dashboard SPA fallback — 子路由由内部 react-router 处理
    handle /dashboard/* {
        try_files {path} /dashboard/index.html
        file_server
    }

    # 其他路由：直接 serve 对应的 HTML 文件
    file_server

    # gRPC-Web 反向代理
    handle /rustbill.* {
        reverse_proxy h2c://127.0.0.1:50051
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

### Nginx

```nginx
server {
    root /var/www/rustbill-consumer;

    # gRPC-Web 反向代理（优先级最高）
    location /rustbill. {
        grpc_pass grpc://127.0.0.1:50051;
    }

    # Dashboard SPA fallback
    location /dashboard {
        try_files $uri /dashboard/index.html;
    }

    # 其他路由：直接 serve HTML 文件
    location / {
        try_files $uri $uri.html $uri/index.html =404;
    }
}
```

> **为什么不用全局 `try_files /index.html`？** Vike SSG 为每个路由生成独立的 HTML 文件，不存在统一的 `index.html` 入口。只有 Dashboard 因内部使用 react-router 做子路由，需要 fallback。

## 设计系统

Dark-Teal-Design 设计语言，所有颜色从单一 `accent` 色通过 HSL 自动推导：

| Token 类别 | 数量 | 说明 |
|-----------|------|------|
| 基础色 | 10 | canvas / surface / border 等 |
| Accent 色 | 10 | 5 级明度 × Default + Foreground |
| 语义色 | 10 | success / warning / error / info |
| 图表色 | 4 | chart-1 ~ chart-4 |

CSS 变量命名：`--rustbill-{category}-{variant}`，构建时自动注入 `<style id="rustbill-brand">`。

**动画系统**：零依赖纯 CSS，基于 tailwindcss-animate + 自定义 @keyframes (shimmer / logoPulse / progressIndeterminate / toastSlideOut)。含微动效 — Card hover 上浮 + 辉光，Button active 按压反馈，TableRow 过渡。

## 国际化

添加新语言：

```bash
# 1. 创建 locale 目录
mkdir -p src/locales/ja/translation.json

# 2. 在 i18n.ts 中注册新语言
# 3. 更新 brand.yaml nav 的 i18n key
```

```ts
// src/i18n.ts
import zhCN from './locales/zh-CN/translation.json'
import enUS from './locales/en-US/translation.json'

i18next.init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: 'zh-CN',           // 默认语言
  fallbackLng: 'en-US',
})
```

## License

MPL-2.0
