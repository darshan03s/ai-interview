import { Button } from "@/components/ui/button"
import type { SelectedInterviewType } from "@/types";
import { memo } from "react";

interface SelectInterviewSectionProps {
    selectedInterview: SelectedInterviewType | null;
    setSelectedInterview: (selectedInterview: SelectedInterviewType) => void;
}

const SelectInterviewSection = ({ selectedInterview, setSelectedInterview }: SelectInterviewSectionProps) => {
    return (
        <div className="flex flex-col gap-4 my-4">
            <h2 className="text-lg sm:text-2xl font-bold text-center">Select Interview Type</h2>
            <div className="options flex items-center justify-between gap-6 px-3 md:px-0">
                <Button
                    variant="outline"
                    className={`${selectedInterview === "technical" ? "ring ring-blue-500" : ""} flex-1 h-35 text-2xl`}
                    onClick={() => setSelectedInterview("technical")}
                >Technical</Button>
                <Button variant="outline"
                    className={`${selectedInterview === "techno-managerial" ? "ring ring-blue-500" : ""} flex-1 h-35 text-2xl`}
                    onClick={() => setSelectedInterview("techno-managerial")}
                >Techno-Managerial</Button>
            </div>
        </div>
    )
}

export default memo(SelectInterviewSection)