import { memo } from "react";

interface EmptyStateProps {
    fetchingInterviews: boolean;
}

const EmptyState = memo(({ fetchingInterviews }: EmptyStateProps) => (
    <div className='text-center text-muted-foreground flex items-center justify-center h-[calc(100vh-10rem)]'>
        {fetchingInterviews ? 'Fetching interviews...' : 'No interviews yet'}
    </div>
));

EmptyState.displayName = 'EmptyState';

export default EmptyState;