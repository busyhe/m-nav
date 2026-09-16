/* eslint-disable @typescript-eslint/no-explicit-any */

import { NotionAPI } from 'notion-client';
import type { Collection, ExtendedRecordMap } from 'notion-types';
import {
  parsePageId,
  getPageTitle,
  getBlockValue,
  getBlockCollectionId,
  getTextContent,
} from 'notion-utils';
import { cache } from 'react';

// Initialize the Notion client
const notion = new NotionAPI({
  authToken: process.env.NOTION_TOKEN,
  userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

// Query results are authoritative: page_sort can contain stale or filtered-out IDs.
export default function getAllPageIds(
  collectionQuery: Record<string, any> | undefined,
  collectionId: string | undefined,
  collectionView: Record<string, any> | undefined,
  viewIds: string[] | undefined,
): string[] {
  const queries = collectionId ? collectionQuery?.[collectionId] : undefined;
  const targetViewIds = viewIds?.length
    ? viewIds.slice(0, 1)
    : Object.keys(queries ?? {});
  const pageSet = new Set<string>();
  let hasQueryResults = false;
  const addIds = (ids: unknown) => {
    if (!Array.isArray(ids)) return;
    hasQueryResults = true;
    for (const id of ids) {
      if (typeof id === 'string') pageSet.add(id);
    }
  };

  for (const viewId of targetViewIds) {
    const query = queries?.[viewId];
    addIds(query?.blockIds);
    for (const reducer of Object.values(query ?? {}) as any[]) {
      addIds(reducer?.blockIds);
    }
  }

  // An explicitly empty query must stay empty, even if page_sort has old IDs.
  if (hasQueryResults) return [...pageSet];

  for (const viewId of targetViewIds) {
    const view = getBlockValue(collectionView?.[viewId]) as any;
    if (Array.isArray(view?.page_sort)) {
      for (const id of view.page_sort) {
        if (typeof id === 'string') pageSet.add(id);
      }
    }
  }
  return [...pageSet];
}

// Helper function to get page properties
function getPageProperties(pageId: string, value: any, schema: any) {
  if (!value || !schema) return null;

  const propertyMap: Record<string, any> = {};

  Object.keys(schema).forEach((key) => {
    const propertyValue = getTextContent(value.properties?.[key]);
    const propertyName = schema[key]?.name;

    if (propertyName) {
      propertyMap[propertyName.toLowerCase()] = propertyValue;
    }
  });

  return {
    id: pageId,
    title: propertyMap.title || propertyMap.name || '',
    description: propertyMap.description || propertyMap.desc || '',
    link: propertyMap.link || propertyMap.url || '',
    type: propertyMap.type || propertyMap.category || 'other',
  };
}

export interface DatabaseItem {
  id: string;
  title: string;
  description: string;
  link: string;
  type: string;
}

export interface PageData {
  title: string;
  description: string;
  items: Record<string, DatabaseItem[]>;
}

// Keep all record tables consistent, including collection views.
export function normalizeRecordMap(recordMap: ExtendedRecordMap): void {
  for (const table of [
    recordMap.block,
    recordMap.collection,
    recordMap.collection_view,
  ]) {
    for (const [id, entry] of Object.entries(table ?? {})) {
      const value = getBlockValue(entry as any);
      if (value) {
        (table as Record<string, any>)[id] = { value, role: 'reader' };
      }
    }
  }
}

export function parsePageData(
  recordMap: ExtendedRecordMap,
  pageId: string,
): PageData {
  normalizeRecordMap(recordMap);
  const rawMetadata = getBlockValue(recordMap.block[pageId]);
  if (!rawMetadata)
    throw new Error('The configured Notion page is unavailable');
  const collectionId =
    getBlockCollectionId(rawMetadata, recordMap) ||
    Object.keys(recordMap.collection)[0];
  const collection = collectionId
    ? (getBlockValue(recordMap.collection[collectionId]) as
        | Collection
        | undefined)
    : undefined;
  if (!collection) throw new Error('No accessible Notion database was found');

  const viewIds = 'view_ids' in rawMetadata ? rawMetadata.view_ids : undefined;
  const pageIds = getAllPageIds(
    recordMap.collection_query,
    collectionId,
    recordMap.collection_view,
    viewIds,
  );
  const items = new Map<string, DatabaseItem[]>();
  for (const id of pageIds) {
    const value = getBlockValue(recordMap.block[id]);
    if (!value) throw new Error(`Missing Notion database item: ${id}`);
    if (value.alive === false) continue;
    const props = getPageProperties(id, value, collection.schema);
    if (!props) continue;
    const group = items.get(props.type) ?? [];
    group.push(props);
    items.set(props.type, group);
  }

  return {
    title:
      getPageTitle(recordMap) ||
      getTextContent(collection.name) ||
      'Navigation',
    description: (rawMetadata.format as any)?.seo_description || '',
    items: Object.fromEntries(items),
  };
}

const getPageDataInternal = async (): Promise<PageData> => {
  if (!process.env.NOTION_PAGE_ID) {
    throw new Error('NOTION_PAGE_ID is not defined in environment variables');
  }

  const pageId = parsePageId(process.env.NOTION_PAGE_ID);
  if (!pageId)
    throw new Error('NOTION_PAGE_ID must be a valid Notion page ID or URL');

  const recordMap = await notion.getPage(pageId, {
    fetchCollections: true,
    fetchMissingBlocks: true,
    throwOnCollectionErrors: true,
    signFileUrls: false,
  });
  return parsePageData(recordMap, pageId);
};

// 使用 React cache 包装函数，确保在同一请求周期内只执行一次
export const getPageData = cache(getPageDataInternal);
