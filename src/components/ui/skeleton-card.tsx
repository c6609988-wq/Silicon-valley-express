import { Skeleton } from '@/components/ui/skeleton';

export const ArticleCardSkeleton = () => (
  <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="flex gap-2">
      <Skeleton className="h-5 w-12 rounded-full" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  </div>
);

export const AISummarySkeleton = () => (
  <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-4/6" />
  </div>
);

export const ChannelCardSkeleton = () => (
  <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);
