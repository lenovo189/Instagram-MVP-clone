import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
        <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex items-center space-x-8 mb-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
          </div>
        </div>
      </div>
      {/* Posts Grid */}
      <div className="mt-8 border-t pt-8">
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
