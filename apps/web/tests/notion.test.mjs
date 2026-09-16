import assert from 'node:assert/strict';
import test from 'node:test';
import getAllPageIds, { parsePageData } from '../lib/notion.ts';

const rootId = '192bba2b-2ae7-806b-b290-c70c06dc0447';
const box = (value, nested) =>
  nested
    ? { spaceId: 'space', value: { value, role: 'reader' } }
    : { value, role: 'reader' };

function fixture(nested) {
  return {
    block: {
      [rootId]: box(
        {
          id: rootId,
          type: 'collection_view_page',
          view_ids: ['view'],
          format: {
            collection_pointer: { id: 'collection' },
            seo_description: 'Description',
          },
        },
        nested,
      ),
      item: box(
        {
          id: 'item',
          type: 'page',
          alive: true,
          properties: {
            title: [['Example'], [' site']],
            url: [['https://example.com']],
            category: [['Tools']],
          },
        },
        nested,
      ),
    },
    collection: {
      unrelated: box(
        { id: 'unrelated', name: [['Wrong database']], schema: {} },
        nested,
      ),
      collection: box(
        {
          id: 'collection',
          name: [['Navigation']],
          schema: {
            title: { name: 'Name', type: 'title' },
            url: { name: 'URL', type: 'url' },
            category: { name: 'Category', type: 'text' },
          },
        },
        nested,
      ),
    },
    collection_view: {
      view: box({ id: 'view', type: 'table', page_sort: ['stale'] }, nested),
    },
    collection_query: {
      collection: {
        view: { collection_group_results: { blockIds: ['item'] } },
      },
    },
  };
}

for (const nested of [false, true]) {
  test(`parses ${nested ? 'nested' : 'legacy'} records and uses the root database`, () => {
    const data = parsePageData(fixture(nested), rootId);
    assert.equal(data.title, 'Navigation');
    assert.equal(data.description, 'Description');
    assert.deepEqual(data.items.Tools, [
      {
        id: 'item',
        title: 'Example site',
        description: '',
        link: 'https://example.com',
        type: 'Tools',
      },
    ]);
  });
}

test('empty query results do not resurrect stale page_sort entries', () => {
  const map = fixture(true);
  map.collection_query.collection.view.collection_group_results.blockIds = [];
  assert.deepEqual(parsePageData(map, rootId).items, {});
});

test('grouped results are deduplicated without mixing other views', () => {
  assert.deepEqual(
    getAllPageIds(
      {
        collection: {
          view: {
            'results:text:Tools': { blockIds: ['one', 'two'] },
            'results:text:Docs': { blockIds: ['two', 'three'] },
          },
          other: { collection_group_results: { blockIds: ['hidden'] } },
        },
      },
      'collection',
      {},
      ['view', 'other'],
    ),
    ['one', 'two', 'three'],
  );
});

test('page_sort fallback supports both record formats and stays within the selected view', () => {
  for (const nested of [false, true]) {
    assert.deepEqual(
      getAllPageIds(
        {},
        'collection',
        {
          view: box({ id: 'view', page_sort: ['one', 'one', 'two'] }, nested),
          other: box({ id: 'other', page_sort: ['hidden'] }, nested),
        },
        ['view'],
      ),
      ['one', 'two'],
    );
  }
});

test('missing rows fail visibly instead of silently rendering an incomplete database', () => {
  const map = fixture(true);
  delete map.block.item;
  assert.throws(
    () => parsePageData(map, rootId),
    /Missing Notion database item/,
  );
});

test('category names that match Object prototype keys remain serializable', () => {
  const map = fixture(false);
  map.block.item.value.properties.category = [['__proto__']];
  const data = parsePageData(map, rootId);
  assert.equal(data.items.__proto__[0].title, 'Example site');
  assert.equal(Object.getPrototypeOf(data.items), Object.prototype);
});
