'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type GalleryAlbum } from './data';
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

interface GalleryClientProps {
  items: GalleryAlbum[];
  uniqueTags: string[];
  currentPage: number;
  totalPages: number;
  activeTag: string;
  activeQuery: string;
  sort: 'desc' | 'asc';
  total: number;
}

export default function GalleryClient({
  items,
  uniqueTags,
  currentPage,
  totalPages,
  activeTag,
  activeQuery,
  sort,
  total,
}: GalleryClientProps) {
  const { navigateToPage, filterBy, changeSort, searchBy } = useListNavigation({
    basePath: '/gallery',
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
      <section id="gallery-header" className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: 'แกลเลอรี่' }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 leading-relaxed">
            แกลเลอรี่
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            รวมอัลบั้มรูปภาพจากกิจกรรมและช่วงเวลาต่าง ๆ
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">ทั้งหมด {total} รายการ</p>
        </div>
      </section>

      <section id="gallery-filter-bar" className="px-4 pb-6">
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

      <section id="gallery-grid" className="grid-section">
        <div className="max-w-7xl mx-auto pt-8">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="ไม่พบอัลบั้ม"
              message="ไม่มีอัลบั้มที่ตรงกับเงื่อนไขการค้นหา"
              icon="fi-sr-picture"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((album, index) => (
                <Link
                  key={album.id}
                  href={`/gallery/${album.id}`}
                  style={{ animationDelay: `${index * 50}ms`, aspectRatio: '16/10' }}
                  className="group block relative rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-md shadow-blue-100/40 dark:shadow-black/20 hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-black/40 hover:-translate-y-1.5 transition-[color,background-color,transform,box-shadow] duration-500 ease-spring overflow-hidden min-h-[200px] animate-scale-up active:scale-[0.98] active:shadow-lg active:duration-150"
                >
                  <Image
                    src={album.cover}
                    alt={album.title}
                    fill
                    sizes={LISTING_IMAGE_SIZES}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 dark:bg-black/30 text-white text-[10px] font-semibold backdrop-blur-md border border-white/25 dark:border-white/15 shadow-lg shadow-black/10 dark:shadow-black/30">
                    <i aria-hidden="true" className="fi fi-sr-picture text-[10px]" />
                    {album.photos.length}
                  </div>

                  <div className="absolute left-0 right-0 bottom-0 w-full z-20 bg-black/40 backdrop-blur-3xs px-4 py-3 border-t border-white/10">
                    <h2 className="text-sm font-bold text-white mb-1.5 line-clamp-1 group-hover:text-blue-300 transition-colors duration-300">
                      {album.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {album.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/30 backdrop-blur-sm border border-white/20 text-white"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/30 backdrop-blur-sm border border-white/20 text-white">
                        <i aria-hidden="true" className="fi fi-sr-calendar-lines text-[8px]" />
                        {formatShortDate(album.date)}
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
