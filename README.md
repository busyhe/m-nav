# M-Nav: Notion-powered Navigation Site

English | [简体中文](./README_zh.md)

A navigation site that displays content from a Notion database, built with Next.js 15.

![M-Nav Example](https://github.com/busyhe/m-nav/blob/main/%20example.png)

## Features

- Fetches data from a Notion page and its databases
- Displays navigation items organized by type/category
- Responsive design with Tailwind CSS
- Dark mode support

## Setup

Requires Node.js 22.18 or later (a transitive dependency of Notion 8 requires Node.js 22). Docker images use Node.js 22.

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

## Deploy with Docker

You can also deploy using Docker:

### Using Docker Compose (Recommended)

```bash
# Copy environment file and configure
cp .env.example .env
# Edit .env with your values

# Build and run
docker compose up -d
```

### Using Docker CLI

```bash
# Build the image
docker build \
  --build-arg NEXT_PUBLIC_GA_ID=your_ga_id \
  -t m-nav .

# Run the container
docker run -d -p 3000:3000 \
  -e NOTION_PAGE_ID=your_notion_page_id \
  -e NEXT_PUBLIC_GA_ID=your_ga_id \
  m-nav
```

The application will be available at `http://localhost:3000`.

`NOTION_PAGE_ID` is read at runtime and is not required when building the Docker image. To upgrade an existing Compose deployment, run `docker compose up -d --build`. On Vercel, select Node.js 22.x or later and redeploy.

Run the Notion parsing regression tests with `pnpm --filter @m-nav/web test`.
