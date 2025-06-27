import { useEffect, useState } from "react";
import { getReport } from "@/api";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import type { ReportType } from "@/types";
import MarkdownRenderer from "./MarkdownRenderer";
import { FileText } from "lucide-react";
import { devLog } from "@/utils/devUtils";

const Report = ({ interviewId }: { interviewId: string }) => {
    const [report, setReport] = useState<ReportType | undefined>();
    const { session, authLoading } = useAuth();
    const [fetchingReport, setFetchingReport] = useState(false);

    const fetchReport = async () => {
        if (authLoading) return;
        if (!session?.access_token) return;
        try {
            setFetchingReport(true);
            const response = await getReport(session.access_token, interviewId);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to fetch report. Client error')
                    console.error(`Failed to fetch report: Client error (${response.status})`)
                    return
                } else if (response.status >= 500) {
                    toast.error('Unable to fetch report. Server error')
                    console.error(`Failed to fetch report: Server error (${response.status})`)
                    return
                }
                toast.error('Unable to fetch report. Unknown error')
                console.error(`Failed to fetch report: Unknown error (${response.status})`)
                return
            }

            const res = await response.json();

            devLog(res);
            if (!res) {
                toast.error("Failed to fetch report, No data received from server");
                console.error("Failed to fetch report, No data received from server");
                return;
            }
            if (res.error) {
                toast.error(res.error.message);
                console.error(res.error.message);
                return;
            }
            setReport(res.data);
        } catch (error) {
            toast.error("Failed to fetch report");
            console.error(error);
        } finally {
            setFetchingReport(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    return (
        <div className="report-section border border-primary/50 dark:border-primary/50 max-w-6xl w-full flex-1 mx-auto p-2 rounded-lg flex flex-col gap-4">
            <h1 className="text-4xl font-bold text-center">Report</h1>
            {report?.is_created ?
                null
                :
                <Button variant="outline" className="mx-auto disabled:opacity-50 disabled:cursor-not-allowed!" onClick={fetchReport} disabled={fetchingReport || report?.is_created}>
                    {fetchingReport ? "Generating report..." : "Get report"}
                </Button>
            }
            {report?.is_created ?
                <a
                    href={report?.report_pdf}
                    target="_blank"
                    className="inline-flex items-center w-full justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group mx-auto"
                >
                    <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    Download report
                </a>

                : null}
            <hr className="px-4" />
            <div className="report-content min-h-[600px] overflow-y-auto hide-scrollbar w-full">
                <MarkdownRenderer report={report?.report} />
            </div>
        </div>
    )
}

export default Report