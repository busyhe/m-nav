'use client';

import { DatabaseItem, PageData } from '@/lib/notion';
import { SiteCard } from './site-card';
import { useSearchContext } from './search-context';
import { useSiteTitle } from './site-title-context';
import { useMemo, useEffect } from 'react';

interface SiteContentClientProps {
  siteData: PageData;
}

export function SiteContentClient({ siteData }: SiteContentClientProps) {
  const { searchQuery } = useSearchContext();
  const { setTitle } = useSiteTitle();

  // 动态更新标题
  useEffect(() => {
    if (siteData.title) {
      setTitle(siteData.title);
    }
  }, [siteData.title, setTitle]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return siteData.items;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, DatabaseItem[]> = {};

    Object.keys(siteData.items || {}).forEach((type: string) => {
      const items = siteData.items[type]?.filter((item: DatabaseItem) => {
        // 模糊搜索：在标题、描述、类型中搜索
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          type.toLowerCase().includes(query)
        );
      });

      if (items && items.length > 0) {
        filtered[type] = items;
      }
    });

    return filtered;
  }, [siteData.items, searchQuery]);

  return (
    <>
      {Object.keys(filteredData).map((type: string) => (
        <div key={type} id={type} className='mb-8 scroll-mt-20'>
          <h2 className='text-xl font-semibold mb-4 capitalize group flex items-center gap-2'>
            {type}
            <a
              href={`#${type}`}
              className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground'
            >
              #
            </a>
          </h2>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {filteredData[type]?.map((item: DatabaseItem) => (
              <SiteCard
                key={item.id}
                title={item.title}
                description={item.description || ''}
                href={item.link}
                category={type}
              />
            ))}
          </div>
        </div>
      ))}
      {Object.keys(filteredData).length === 0 && searchQuery.trim() && (
        <div className='text-center py-8'>
          <p className='text-muted-foreground'>
            没有找到与 &quot;{searchQuery}&quot; 相关的结果
          </p>
        </div>
      )}
    </>
  );
}
