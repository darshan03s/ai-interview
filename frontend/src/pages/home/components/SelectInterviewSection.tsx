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
            <div className="options flex flex-col lg:flex-row items-center justify-between gap-6 px-4 md:px-0">
                <Button
                    variant="outline"
                    className={`${selectedInterview === "technical" ? "ring ring-blue-500" : ""} lg:flex-1 w-full h-20 lg:h-35 text-lg lg:text-4xl`}
                    onClick={() => setSelectedInterview("technical")}
                >Technical</Button>
                <Button variant="outline"
                    className={`${selectedInterview === "techno-managerial" ? "ring ring-blue-500" : ""} lg:flex-1 w-full h-20 lg:h-35 text-lg lg:text-4xl`}
                    onClick={() => setSelectedInterview("techno-managerial")}
                >Techno-Managerial</Button>
            </div>
        </div>
    )
}

export default memo(SelectInterviewSection)