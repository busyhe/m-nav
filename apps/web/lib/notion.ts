/* eslint-disable @typescript-eslint/no-explicit-any */

import { NotionAPI } from 'notion-client';
import { ExtendedRecordMap } from 'notion-types';
import { idToUuid, getPageTitle } from 'notion-utils';
import { cache } from 'react';

// Initialize the Notion client
const notion = new NotionAPI({
  authToken: process.env.NOTION_TOKEN,
  userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

// Helper function to get all page IDs from a collection
export default function getAllPageIds(
  collectionQuery: Record<string, any>,
  collectionId: string | undefined,
  collectionView: Record<string, any>,
  viewIds: string[] | undefined,
) {
  // Return empty array if any required parameters are missing
  if (!collectionQuery || !collectionId || !viewIds || viewIds.length === 0) {
    return [];
  }

  try {
    // Safely access the collection data
    const collectionData = collectionQuery[collectionId];
    if (!collectionData) return [];

    const viewId = viewIds[0];
    if (!viewId) return [];

    // Type assertion to avoid TypeScript error
    const view = collectionData[viewId] as any;
    const tableGroups = view.table_groups || view.list_groups;
    if (!view || !tableGroups || !tableGroups.results) return [];

    const groups = [];

    for (const group of tableGroups.results) {
      if (!group?.value?.value) continue;

      const title = group.value.value.value || '';
      const items = view[`results:text:${title}`]?.blockIds || [];

      groups.push({ title, items });
    }

    return groups;
  } catch (error) {
    console.error('Error fetching page IDs:', error);
    return [];
  }
}

// Helper function to get page properties
function getPageProperties(
  pageId: string,
  value: any,
  schema: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prefix = '',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pageProperties: any[] = [],
) {
  if (!value || !schema) return null;

  const propertyMap: Record<string, any> = {};

  Object.keys(schema).forEach((key) => {
    const propertyValue = value.properties?.[key]?.[0]?.[0];
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

export function normalizeRecordMap(recordMap: ExtendedRecordMap): void {
  // Normalize blocks
  for (const blockId of Object.keys(recordMap.block)) {
    const entry = recordMap.block[blockId] as any;
    if (
      entry?.value &&
      typeof entry.value === 'object' &&
      entry.value.value &&
      typeof entry.value.value === 'object' &&
      entry.value.value.id
    ) {
      // Double-nested: flatten { value: { value: {...}, role }, spaceId } → { value: {...}, role }
      recordMap.block[blockId] = {
        value: entry.value.value,
        role: entry.value.role ?? entry.role ?? 'reader',
      } as any;
    }
  }

  // Normalize collections (same pattern can occur)
  if (recordMap.collection) {
    for (const collectionId of Object.keys(recordMap.collection)) {
      const entry = recordMap.collection[collectionId] as any;
      if (
        entry?.value &&
        typeof entry.value === 'object' &&
        entry.value.value &&
        typeof entry.value.value === 'object' &&
        entry.value.value.id
      ) {
        recordMap.collection[collectionId] = {
          value: entry.value.value,
          role: entry.value.role ?? entry.role ?? 'reader',
        } as any;
      }
    }
  }
}

const getPageDataInternal = async (): Promise<PageData> => {
  if (!process.env.NOTION_PAGE_ID) {
    throw new Error('NOTION_PAGE_ID is not defined in environment variables');
  }

  const envPageId = process.env.NOTION_PAGE_ID;
  const pageId = idToUuid(envPageId);

  try {
    // Fetch the page data with additional options
    const recordMap = await notion.getPage(pageId, {
      fetchCollections: true,
      fetchMissingBlocks: true,
    });

    normalizeRecordMap(recordMap);

    // Get collection data
    const collection = Object.values(recordMap.collection)[0]?.value;
    const collectionQuery = recordMap.collection_query;
    const block = recordMap.block;
    const schema = collection?.schema;
    const rawMetadata = block[pageId]?.value as any;
    const collectionView = recordMap.collection_view;
    const collectionId = Object.keys(recordMap.collection)[0];
    const viewIds = rawMetadata?.view_ids as string[] | undefined;

    // Get page title and icon
    const title =
      getPageTitle(recordMap) ||
      rawMetadata?.properties?.title?.[0]?.[0] ||
      'Navigation';
    const description = rawMetadata?.format?.seo_description || '';

    // Get all page IDs from the collection
    const pageGroups = getAllPageIds(
      collectionQuery,
      collectionId || '',
      collectionView,
      viewIds || [],
    );

    // Process items by type
    const itemsByType: Record<string, DatabaseItem[]> = {};

    // Process each group of pages
    pageGroups
      .filter((group: { items: string[] }) => group.items?.length > 0)
      .forEach((group: { items: string[] }) => {
        if (!group.items) return;

        group.items.forEach((id: string) => {
          const blockItem = block[id];
          if (!blockItem) return;

          const value = blockItem.value;
          if (!value) return;

          const props = getPageProperties(
            id,
            value,
            schema,
            '',
            collection?.format?.collection_page_properties,
          );
          if (!props) return;

          const type = props.type || 'other';

          if (!itemsByType[type]) {
            itemsByType[type] = [];
          }

          itemsByType[type].push(props);
        });
      });

    return {
      title,
      description,
      items: itemsByType,
    };
  } catch (error) {
    console.error('Error fetching Notion data:', error);
    throw error;
  }
};

// 使用 React cache 包装函数，确保在同一请求周期内只执行一次
export const getPageData = cache(getPageDataInternal);
