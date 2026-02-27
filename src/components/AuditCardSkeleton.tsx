import { Skeleton } from "@/components/ui/skeleton";

export const AuditCardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-5 space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="w-10 h-10 rounded-lg" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const AuditListSkeleton = ({ count = 4, columns = "md:grid-cols-2" }: { count?: number; columns?: string }) => (
  <div className={`grid grid-cols-1 ${columns} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <AuditCardSkeleton key={i} />
    ))}
  </div>
);

export const ReportSkeleton = () => (
  <div className="space-y-6">
    {/* Score card skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-6 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </div>
      <div className="md:col-span-2 bg-card border border-border rounded-lg p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
    {/* Tab skeleton */}
    <Skeleton className="h-10 w-full max-w-lg rounded-lg" />
    {/* Findings list skeleton */}
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

export const BillingHistorySkeleton = () => (
  <div className="divide-y divide-border">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

export const SettingsPageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  </div>
);

export const SubscriptionSkeleton = () => (
  <div className="space-y-4">
    <div className="bg-card border border-border rounded-lg p-6 space-y-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-48" />
    </div>
    <div className="bg-card border border-border rounded-lg p-6 space-y-3">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
