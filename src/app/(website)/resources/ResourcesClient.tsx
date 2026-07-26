'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ResourceItem } from './data';
import Breadcrumb from '@/components/Breadcrumb';
import { formatShortDate } from '@/lib/format';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useListFilter } from '@/hooks/useListFilter';
import SearchInput from '@/components/SearchInput';
import FilterBar from '@/components/FilterBar';
import SortSelect from '@/components/SortSelect';
import { LISTING_IMAGE_SIZES } from '@/lib/constants';

interface ResourcesClientProps {
  items: ResourceItem[];
  uniqueTypes: string[];
  uniqueTags: string[];
  currentPage: number;
  totalPages: number;
  activeType: string;
  activeQuery: string;
  sort: 'Newest' | 'Oldest';
  total: number;
}

export default function ResourcesClient({
  items,
  uniqueTypes,
  currentPage,
  totalPages,
  activeType,
  activeQuery,
  sort,
  total,
}: ResourcesClientProps) {
  const { navigateToPage, filterBy, changeSort, searchBy } = useListNavigation({
    basePath: '/resources',
    filterKey: 'type',
    allLabel: 'All',
  });

  const {
    localQuery,
    setLocalQuery,
    filteredItems,
    handlePageChange,
  } = useListFilter({
    items,
    activeQuery,
    activeFilter: activeType,
    sort,
    onFilterChange: searchBy,
    onPageChange: navigateToPage,
  });

  const allTypes = ['All', ...uniqueTypes];

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: 'สื่อการเรียนรู้' }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 leading-relaxed">
            สื่อการเรียนรู้
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            เอกสารประกอบการเรียน สไลด์ และวิดีโอความรู้
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">ทั้งหมด {total} รายการ</p>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <SearchInput value={localQuery} onChange={setLocalQuery} />

          <FilterBar
            allItems={allTypes}
            activeItem={activeType}
            sort={sort}
            onFilter={filterBy}
            labelTransform={(item) => item === 'All' ? 'ทั้งหมด' : item}
          />

          <SortSelect
            value={sort}
            onChange={(value) => changeSort(value, activeType)}
            options={[
              { value: 'Newest', label: 'ใหม่สุด' },
              { value: 'Oldest', label: 'เก่าสุด' },
            ]}
          />
        </div>
      </section>

      <section className="grid-section">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="ไม่พบสื่อการเรียนรู้"
              message="ไม่มีสื่อการเรียนรู้ที่ตรงกับเงื่อนไขการค้นหา"
              icon="fi-sr-book-alt"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.link.startsWith('/') ? item.link : `/resources/${item.id}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="group flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 dark:border-slate-700/50 shadow-xs dark:shadow-black/20 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-black/40 hover:-translate-y-1 transition-[color,background-color,transform,box-shadow] duration-500 ease-spring animate-scale-up active:scale-[0.98] active:shadow-lg active:duration-150"
                >
                  <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-slate-800">
                    {item.cover ? (
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes={LISTING_IMAGE_SIZES}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i
                          aria-hidden="true"
                          className="fi fi-sr-book-alt text-3xl text-zinc-400"
                        />
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/40 shadow-sm ${
                          item.type === 'Worksheet'
                            ? 'bg-green-500/50 text-white'
                            : item.type === 'Article'
                              ? 'bg-orange-500/50 text-white'
                              : item.type === 'Video'
                                ? 'bg-red-500/50 text-white'
                                : item.type === 'Interactive'
                                  ? 'bg-purple-500/50 text-white'
                                  : 'bg-blue-500/50 text-white'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-slate-800 mt-auto">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <i aria-hidden="true" className="fi fi-sr-calendar"></i>
                        {formatShortDate(item.date)}
                      </span>

                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shrink-0">
                        <i aria-hidden="true" className="fi fi-sr-arrow-up-right text-xs"></i>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
    </div>
  );
}
