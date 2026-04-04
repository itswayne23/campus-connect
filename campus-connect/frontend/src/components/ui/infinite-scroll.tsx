import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollProps {
  isLoading: boolean
  hasMore: boolean
  children: React.ReactNode
  loader?: React.ReactNode
}

export const InfiniteScroll = forwardRef<HTMLDivElement, InfiniteScrollProps>(
  ({ isLoading, hasMore, children, loader }, ref) => {
    return (
      <div>
        {children}
        <div ref={ref} className="flex justify-center py-4">
          {isLoading && (
            loader || (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )
          )}
          {!hasMore && !isLoading && (
            <p className="text-sm text-muted-foreground">No more items</p>
          )}
        </div>
      </div>
    )
  }
)

InfiniteScroll.displayName = 'InfiniteScroll'
