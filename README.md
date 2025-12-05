# M-Nav: Notion-powered Navigation Site

English | [简体中文](./README_zh.md)

A navigation site that displays content from a Notion database, built with Next.js 15.

## Features

- Fetches data from a Notion page and its databases
- Displays navigation items organized by type/category
- Responsive design with Tailwind CSS
- Dark mode support

## Setup

1. Clone the repository:

```bash
git clone https://github.com/busyhe/m-nav.git
cd m-nav
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env.local` file in the `apps/web` directory:

```bash
NOTION_PAGE_ID=your_notion_page_id
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Replace `your_notion_page_id` with your Notion page ID (the part of the URL after `notion.so/` and before any `?` character).

Replace `G-XXXXXXXXXX` with your Google Analytics Measurement ID, or remove/leave empty to disable Google Analytics.

## Google Analytics Configuration

Google Analytics is conditionally enabled based on the `NEXT_PUBLIC_GA_ID` environment variable:

- **To enable**: Set `NEXT_PUBLIC_GA_ID` to your Google Analytics Measurement ID (e.g., `G-XXXXXXXXXX`)
- **To disable**: Remove the variable or leave it empty

The Google Analytics integration will only load when the environment variable is present and not empty, ensuring no tracking occurs in development or when analytics are not desired.

## Notion Database Structure

Your Notion page should contain one or more databases with the following properties:

- **Title/Name**: The name of the navigation item
- **Type/Category**: Used to group navigation items
- **Description/Desc**: A short description of the item (optional)
- **Link/URL**: The URL to navigate to when clicking the item

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Duplicate this Notion template

   [Notion nav demo page](https://busyhe.notion.site/192bba2b2ae7806bb290c70c06dc0447?v=192bba2b2ae780c499e4000c52e7df77)

2. Click the button below to deploy:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbusyhe%2Fm-nav)

3. Configure environment variables:
   - Set `NOTION_PAGE_ID` to your Notion page ID
   - Set `NEXT_PUBLIC_GA_ID` to your Google Analytics ID (optional)

4. Deploy and enjoy your navigation site!

You can also manually deploy by pushing to your Vercel-connected GitHub repository.
