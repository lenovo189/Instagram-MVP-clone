import { Skeleton } from '@/components/ui/skeleton';

export default function PostFeedSkeleton() {
  return (
    <div className="max-w-2xl mx-auto mt-20 space-y-8 px-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center p-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="ml-4 h-4 w-24" />
          </div>
          {/* Media */}
          <Skeleton className="w-full aspect-square" />
          {/* Actions */}
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="w-6 h-6 rounded" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            {/* Comments preview */}
            <div className="space-y-2 mt-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            {/* Comment input */}
            <div className="flex items-center mt-4">
              <Skeleton className="flex-1 h-8 rounded-l-lg" />
              <Skeleton className="w-16 h-8 rounded-r-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
