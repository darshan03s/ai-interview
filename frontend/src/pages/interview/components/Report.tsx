import { Button } from "@/components/ui/button";
import MarkdownRenderer from "./MarkdownRenderer";
// import { FileText } from "lucide-react";
import useInterview from "../hooks/useInterview";
import { memo, useEffect, useRef } from "react";
import useInterviewStore from "../stores/interviewStore";

const Report = () => {
    const reportTitleRef = useRef<HTMLHeadingElement>(null);
    const { fetchReport } = useInterview();
    const report = useInterviewStore(state => state.report);
    const isFetchingReport = useInterviewStore(state => state.isFetchingReport);

    useEffect(() => {
        if (reportTitleRef.current) {
            reportTitleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [report]);

    return (
        <div className="report-section border border-primary/50 dark:border-primary/50 max-w-[90%] w-full flex-1 mx-auto p-3 py-6 rounded-lg flex flex-col gap-2">
            <h1 ref={reportTitleRef} className="text-2xl md:text-4xl font-bold text-center">Report</h1>
            {report?.is_created ?
                null
                :
                <Button variant="outline" className="mx-auto disabled:opacity-50 disabled:cursor-not-allowed!"
                    onClick={fetchReport} disabled={isFetchingReport || report?.is_created}>
                    {isFetchingReport ? "Fetching report..." : "Get report"}
                </Button>
            }
            {/* {report?.is_created ?
                <a
                    href={report?.report_pdf}
                    target="_blank"
                    className="inline-flex items-center w-full justify-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors group mx-auto"
                >
                    <FileText className="h-3 w-3 md:h-4 md:w-4 group-hover:scale-110 transition-transform" />
                    Download report
                </a>

                : null} */}
            <hr className="px-4 my-4" />
            <div className="report-content min-h-[600px] overflow-y-auto hide-scrollbar w-full">
                <MarkdownRenderer report={report?.report} />
            </div>
        </div>
    )
}

export default memo(Report);