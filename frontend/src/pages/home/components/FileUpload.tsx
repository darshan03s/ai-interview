import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Upload } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useRef, useState } from "react";
import type { PdfFileType } from "@/types";

interface FileUploadProps {
    selectedPdf: PdfFileType | null;
    setSelectedPdf: (pdf: PdfFileType | null) => void;
    setShowSignInModal: (show: boolean) => void;
}

const FileUpload = ({ selectedPdf, setSelectedPdf, setShowSignInModal }: FileUploadProps) => {
    const { session, authLoading } = useAuth();
    const [uploadError, setUploadError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE_NUMBER = 2;
    const MAX_FILE_SIZE = MAX_FILE_SIZE_NUMBER * 1024 * 1024;

    const handleFileSelect = () => {
        if (!session) {
            setShowSignInModal(true);
            return;
        }
        fileInputRef.current?.click();
    };

    const validateFile = (file: File): string | null => {
        if (file.type !== 'application/pdf') {
            return 'Please select a PDF file only.';
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File size must be less than ${MAX_FILE_SIZE_NUMBER}MB.`;
        }
        return null;
    };

    const handleRemovePdf = () => {
        if (selectedPdf?.url) {
            URL.revokeObjectURL(selectedPdf.url);
        }
        setSelectedPdf(null);
        setUploadError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes: number): string => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadError("");

        const validationError = validateFile(file);
        if (validationError) {
            setUploadError(validationError);
            return;
        }

        const fileUrl = URL.createObjectURL(file);

        setSelectedPdf({
            file,
            url: fileUrl,
        });
    };

    return (
        <>
            <Card className="mx-6 md:mx-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-md sm:text-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        Resume Upload
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-base whitespace-wrap sm:whitespace-nowrap">
                        Select a PDF file (max {MAX_FILE_SIZE_NUMBER}MB) to upload your resume
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* File Input Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${selectedPdf
                            ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                            }`}
                        onClick={handleFileSelect}
                    >
                        <div className="flex flex-col items-center gap-4">
                            {selectedPdf ? (
                                <>
                                    <FileText className="h-12 w-12 text-green-600" />
                                    <div>
                                        <p className="text-sm md:text-base font-medium text-foreground">
                                            {selectedPdf.file.name}
                                        </p>
                                        <p className="text-xs md:text-sm text-muted-foreground">
                                            {formatFileSize(selectedPdf.file.size)} • PDF File
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs md:text-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePdf();
                                        }}
                                    >
                                        Remove File
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-medium text-foreground">
                                            Click to upload your resume
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            PDF files only, up to {MAX_FILE_SIZE_NUMBER}MB
                                        </p>
                                    </div>
                                    {!session && (
                                        <p className="text-xs text-orange-600 dark:text-orange-400">
                                            {!authLoading && 'Sign in required to upload files'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Hidden File Input */}
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Error Display */}
                    {uploadError && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            {uploadError}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}

export default FileUpload