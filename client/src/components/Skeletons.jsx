export function RestaurantCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden animate-pulse">
      <div className="h-48 w-full bg-stone-200/80 dark:bg-stone-800" />
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-2/3 rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-5 w-12 rounded-lg bg-stone-200 dark:bg-stone-800" />
        </div>
        <div className="h-4 w-1/2 rounded-md bg-stone-100 dark:bg-stone-800/70" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 rounded-full bg-stone-100 dark:bg-stone-800/70" />
          <div className="h-6 w-20 rounded-full bg-stone-100 dark:bg-stone-800/70" />
        </div>
        <div className="flex items-center justify-between border-t border-stone-100 pt-2 dark:border-stone-800">
          <div className="h-4 w-24 rounded bg-stone-100 dark:bg-stone-800/70" />
          <div className="h-9 w-28 rounded-xl bg-stone-200 dark:bg-stone-800" />
        </div>
      </div>
    </div>
  );
}

export function RestaurantGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <RestaurantCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function RestaurantDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-72 w-full rounded-3xl bg-stone-200 dark:bg-stone-800 sm:h-96" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-8 w-2/3 rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-4 w-full rounded bg-stone-100 dark:bg-stone-800/70" />
          <div className="h-4 w-5/6 rounded bg-stone-100 dark:bg-stone-800/70" />
          <div className="h-40 w-full rounded-2xl bg-stone-100 dark:bg-stone-800/70" />
        </div>
        <div className="h-64 rounded-2xl bg-stone-200 dark:bg-stone-800" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="card-surface overflow-hidden animate-pulse">
      <div className="border-b border-stone-200 bg-stone-50/80 px-5 py-3.5 dark:border-stone-800 dark:bg-stone-900">
        <div className="h-4 w-48 rounded bg-stone-200 dark:bg-stone-800" />
      </div>
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((__, colIdx) => (
              <div
                key={colIdx}
                className="h-4 flex-1 rounded bg-stone-100 dark:bg-stone-800/70"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="card-surface space-y-3 p-5">
            <div className="h-4 w-28 rounded bg-stone-100 dark:bg-stone-800/70" />
            <div className="h-8 w-20 rounded bg-stone-200 dark:bg-stone-800" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-surface h-72 bg-stone-100/60 dark:bg-stone-900/60" />
        <div className="card-surface h-72 bg-stone-100/60 dark:bg-stone-900/60" />
      </div>
    </div>
  );
}
