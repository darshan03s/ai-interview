import { Loader2 } from "lucide-react";
import { memo } from "react";

const PageLoading = () => {
    return (
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
};
export default memo(PageLoading);