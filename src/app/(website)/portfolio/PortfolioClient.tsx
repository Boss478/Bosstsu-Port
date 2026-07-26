'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type PortfolioItem } from './data';
import { formatShortDate } from '@/lib/format';
import Breadcrumb from '@/components/Breadcrumb';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useListFilter } from '@/hooks/useListFilter';
import SearchInput from '@/components/SearchInput';
import FilterBar from '@/components/FilterBar';
import SortSelect from '@/components/SortSelect';
import { LISTING_IMAGE_SIZES } from '@/lib/constants';

interface PortfolioClientProps {
  items: PortfolioItem[];
  uniqueTags: string[];
  currentPage: number;
  totalPages: number;
  activeTag: string;
  activeQuery: string;
  sort: 'desc' | 'asc';
  total: number;
}

export default function PortfolioClient({
  items,
  uniqueTags,
  currentPage,
  totalPages,
  activeTag,
  activeQuery,
  sort,
  total,
}: PortfolioClientProps) {
  const { navigateToPage, filterBy, changeSort, searchBy } = useListNavigation({
    basePath: '/portfolio',
    filterKey: 'tag',
  });

  const {
    localQuery,
    setLocalQuery,
    filteredItems,
    handlePageChange,
  } = useListFilter({
    items,
    activeQuery,
    activeFilter: activeTag,
    sort,
    onFilterChange: searchBy,
    onPageChange: navigateToPage,
  });

  const allTags = ['ทั้งหมด', ...uniqueTags];

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <section id="portfolio-header" className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: 'ผลงาน' }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 leading-relaxed">
            ผลงาน
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            รวบรวมโปรเจกต์ ผลงาน และกิจกรรมต่าง ๆ
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">ทั้งหมด {total} รายการ</p>
        </div>
      </section>

      <section id="portfolio-filter-bar" className="px-4 pb-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <SearchInput value={localQuery} onChange={setLocalQuery} />

          <FilterBar
            allItems={allTags}
            activeItem={activeTag}
            sort={sort}
            onFilter={filterBy}
          />

          <SortSelect
            value={sort}
            onChange={(value) => changeSort(value, activeTag)}
            options={[
              { value: 'desc', label: 'ใหม่สุด' },
              { value: 'asc', label: 'เก่าสุด' },
            ]}
          />
        </div>
      </section>

      <section id="portfolio-grid" className="grid-section">
        <div className="max-w-7xl mx-auto pt-8">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="ไม่พบผลงาน"
              message="ไม่มีผลงานที่ตรงกับเงื่อนไขการค้นหา"
              icon="fi-sr-briefcase"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/portfolio/${item.id}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="group flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 overflow-hidden shadow-xl shadow-blue-900/5 dark:shadow-black/20 transition-[color,background-color,transform,box-shadow] duration-500 ease-spring hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 dark:hover:shadow-black/40 hover:bg-white/60 dark:hover:bg-slate-800/60 animate-scale-up active:scale-[0.98] active:shadow-lg active:duration-150"
                  suppressHydrationWarning
                >
                  <div
                    className="relative w-full shrink-0 overflow-hidden bg-blue-100 dark:bg-slate-800 flex items-center justify-center"
                    style={{ height: '14rem' }}
                  >
                    {item.cover ? (
                      <>
                        <Image
                          src={item.cover}
                          alt={item.title}
                          fill
                          sizes={LISTING_IMAGE_SIZES}
                          className="object-cover group-hover:scale-105 transition-transform duration-500 z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-slate-800 z-0">
                          <i
                            aria-hidden="true"
                            className="fi fi-sr-briefcase text-4xl text-blue-200 dark:text-slate-600 group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </>
                    ) : (
                      <i
                        aria-hidden="true"
                        className="fi fi-sr-briefcase text-4xl text-blue-200 dark:text-slate-600 group-hover:scale-110 transition-transform duration-500"
                      />
                    )}

                    {item.gallery && item.gallery.length > 0 && (
                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold backdrop-blur-3xs shadow-sm">
                        <i
                          aria-hidden="true"
                          className="fi fi-sr-picture text-blue-500 text-[10px]"
                        />
                        {item.gallery.length}
                      </div>
                    )}

                    {item.tools && item.tools.length > 0 && (
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold backdrop-blur-xs shadow-sm">
                        <i
                          aria-hidden="true"
                          className="fi fi-sr-gavel text-blue-500 text-[10px]"
                        />
                        {item.tools.length}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-5 lg:p-6">
                    <header className="mb-2">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 leading-normal">
                        {item.title}
                      </h2>
                    </header>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-8">
                      {item.description}
                    </p>

                    <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                        <i aria-hidden="true" className="fi fi-sr-calendar-lines" />
                        {formatShortDate(item.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors duration-300">
                        อ่านต่อ
                        <i
                          aria-hidden="true"
                          className="fi fi-sr-arrow-right text-[10px] transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </span>
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
