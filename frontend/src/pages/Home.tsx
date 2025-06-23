import { useState, useRef } from "react";
import { Upload, FileText, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createInterview, prepareInterview } from "@/api";
import { toast } from "sonner";
import type { PdfFile, Interview } from "@/types";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { session, signInWithGoogle, authLoading } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creatingInterview, setCreatingInterview] = useState(false);
  const [preparingInterview, setPreparingInterview] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const navigate = useNavigate();

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

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      setShowSignInModal(false);
    } catch (error) {
      console.error('Sign in error:', error);
    }
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

  const handleContinue = async () => {
    if (selectedPdf) {
      setCreatingInterview(true);
      const token = session?.access_token;
      const username = session?.user?.user_metadata.full_name;
      if (!token) {
        console.error('User not signed in');
        return;
      }
      try {
        const response = await createInterview(token, username, selectedPdf.file);
        if (!response.ok) {
          toast.error('Failed to create interview, Bad response from server');
          console.error('Failed to create interview, Bad response from server');
          return;
        }
        const interviewResponse = await response.json();
        if (!interviewResponse.interview) {
          toast.error('Failed to create interview, No interview ID returned');
          console.error('Failed to create interview, No interview ID returned');
          return;
        }
        setInterview(interviewResponse.interview);
        console.log('Interview created:', interviewResponse.interview);
        // console.log('Continue with PDF:', selectedPdf.file.name);
      } catch (error) {
        toast.error('Failed to create interview, Error from server');
        console.error('Failed to create interview, Error from server:', error);
      } finally {
        setCreatingInterview(false);
      }
    }
  };

  const handlePrepareInterview = async () => {
    if (interview) {
      setPreparingInterview(true);
      const token = session?.access_token;
      if (!token) {
        console.error('User not signed in');
        return;
      }
      try {
        const response = await prepareInterview(token, interview);
        if (!response.ok) {
          toast.error('Failed to prepare interview, Bad response from server');
          console.error('Failed to prepare interview, Bad response from server');
          return;
        }
        const interviewResponse = await response.json();

        if (!interviewResponse) {
          toast.error('Failed to prepare interview');
          console.error('Failed to prepare interview');
          return;
        }
        navigate(`/interview/${interview.interview_id}`);


      } catch (error) {
        toast.error('Failed to prepare interview, Error from server');
        console.error('Failed to prepare interview, Error from server:', error);
      } finally {
        setPreparingInterview(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Upload Your Resume
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your resume in PDF format to get started with your AI-powered interview.
            Our AI will analyze your experience and prepare personalized questions.
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Upload
            </CardTitle>
            <CardDescription>
              Select a PDF file (max {MAX_FILE_SIZE_NUMBER}MB) to upload your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${selectedPdf
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
                      <p className="text-lg font-medium text-foreground">
                        {selectedPdf.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedPdf.file.size)} • PDF File
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
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

        {/* Continue Button */}
        {selectedPdf && !interview && (
          <div className="flex justify-center">
            <Button
              onClick={handleContinue}
              size="lg"
              className="min-w-32"
            >
              {creatingInterview ? 'Creating Interview...' : 'Continue'}
            </Button>
          </div>
        )}

        {interview && (
          <div className="flex justify-center">
            <Button
              onClick={handlePrepareInterview}
              size="lg"
              className="min-w-32"
            >
              {preparingInterview ? 'Preparing Interview...' : 'Prepare Interview'}
            </Button>
          </div>
        )}

        {/* Sign In Modal */}
        <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Sign In Required
              </DialogTitle>
              <DialogDescription>
                You need to sign in to upload and process your resume. This helps us securely store your data and provide personalized interview questions.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <Button
                onClick={handleSignIn}
                disabled={authLoading}
                className="w-full"
              >
                {authLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in with Google
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSignInModal(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};

export default Home;
