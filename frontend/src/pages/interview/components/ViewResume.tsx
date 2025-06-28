import { FileText } from "lucide-react"
import { memo } from "react";

interface ViewResumeProps {
    resumeUrl: string | undefined
}

const ViewResume = ({ resumeUrl }: ViewResumeProps) => {
    if (!resumeUrl) return null;
    return (
        <div className="resume-url flex items-center justify-center gap-2 h-4">
            <a
                href={resumeUrl || ""}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors group mx-auto"
            >
                <FileText className="h-3 w-3 md:h-4 md:w-4 group-hover:scale-110 transition-transform" />
                View your resume
            </a>
        </div>
    )
}

export default memo(ViewResume);