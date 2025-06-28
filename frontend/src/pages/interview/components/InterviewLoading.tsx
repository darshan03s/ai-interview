import { memo } from "react";

const InterviewLoading = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Your interview will begin shortly...</p>
            </div>
        </div>
    )
}

export default memo(InterviewLoading);