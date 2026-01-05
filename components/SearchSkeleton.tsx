import { Skeleton } from '@/components/ui/skeleton';

export default function SearchSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Search Input */}
      <div className="mb-6">
        <Skeleton className="w-full h-12 rounded-lg" />
      </div>
      {/* User Cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-4 flex-1">
              <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            </div>
            <Skeleton className="ml-4 h-9 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
