# M-Nav: 基于 Notion 的导航网站

[English](./README.md) | 简体中文

一个从 Notion 数据库获取内容并展示的导航网站，基于 Next.js 15 构建。

## 特性

- 从 Notion 页面及其数据库获取数据
- 按类型/分类展示导航项目
- 使用 Tailwind CSS 实现响应式设计
- 支持深色模式

## 安装

1. 克隆仓库：

```bash
git clone https://github.com/busyhe/m-nav.git
cd m-nav
```

2. 安装依赖：

```bash
pnpm install
```

3. 在 `apps/web` 目录下创建 `.env.local` 文件：

```bash
NOTION_PAGE_ID=your_notion_page_id
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

将 `your_notion_page_id` 替换为你的 Notion 页面 ID（URL 中 `notion.so/` 后面、`?` 前面的部分）。

将 `G-XXXXXXXXXX` 替换为你的 Google Analytics 跟踪 ID，或者留空/删除以禁用 Google Analytics。

## Google Analytics 配置

Google Analytics 根据 `NEXT_PUBLIC_GA_ID` 环境变量有条件地启用：

- **启用**：将 `NEXT_PUBLIC_GA_ID` 设置为你的 Google Analytics 跟踪 ID（例如 `G-XXXXXXXXXX`）
- **禁用**：删除该变量或留空

只有当环境变量存在且不为空时，Google Analytics 才会加载，确保在开发环境或不需要分析时不会进行跟踪。

## Notion 数据库结构

你的 Notion 页面应包含一个或多个数据库，具有以下属性：

- **Title/Name**：导航项目的名称
- **Type/Category**：用于分组导航项目
- **Description/Desc**：项目的简短描述（可选）
- **Link/URL**：点击项目时跳转的链接

## 在 Vercel 上部署

部署 Next.js 应用最简单的方式是使用 [Vercel 平台](https://vercel.com/new)。

1. 复制这个 Notion 模板

   [Notion 导航演示页面](https://busyhe.notion.site/192bba2b2ae7806bb290c70c06dc0447?v=192bba2b2ae780c499e4000c52e7df77)

2. 点击下方按钮部署：

   [![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbusyhe%2Fm-nav)

3. 配置环境变量：
   - 将 `NOTION_PAGE_ID` 设置为你的 Notion 页面 ID
   - 将 `NEXT_PUBLIC_GA_ID` 设置为你的 Google Analytics ID（可选）

4. 部署并享受你的导航网站！

你也可以通过推送到连接 Vercel 的 GitHub 仓库来手动部署。
