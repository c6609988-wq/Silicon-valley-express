import { Skeleton } from '@/components/ui/skeleton';

export const ArticleCardSkeleton = () => (
  <div style={{
    background: '#FFFFFF', border: '1px solid #EAEAEA',
    borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    padding: '18px 20px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Skeleton className="h-[26px] w-[72px] rounded-[8px]" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
    <Skeleton className="h-5 w-full mb-2" />
    <Skeleton className="h-5 w-4/5 mb-3" />
    <Skeleton className="h-4 w-full mb-1" />
    <Skeleton className="h-4 w-3/4 mb-3" />
    <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
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
