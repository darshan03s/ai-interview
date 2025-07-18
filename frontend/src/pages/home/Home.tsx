import { useState, useEffect, useCallback, memo } from "react";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { createInterview } from "@/api";
import { toast } from "sonner";
import type { PdfFileType, InterviewType, SelectedInterviewType } from "@/types";
import { useNavigate } from "react-router-dom";
import SignInModal from "./components/SignInModal";
import FileUpload from "./components/FileUpload";
import SelectInterviewSection from "./components/SelectInterviewSection";

const CTA = memo(() => {
  return (
    <div className="text-center max-w-xl md:max-w-full mx-auto flex flex-col gap-3">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary whitespace-wrap lg:whitespace-nowrap px-3 md:px-0">
        Master Your Next Interview with AI-Powered Practice
      </h1>
      <p className="text-sm sm:text-base md:text-md text-muted-foreground max-w-2xl mx-auto">
        Upload your resume to get started.
      </p>
    </div>
  );
});

const Home = () => {
  const { session, signInWithGoogle, authLoading } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState<PdfFileType | null>(null);
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [creatingInterview, setCreatingInterview] = useState<boolean>(false);
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const navigate = useNavigate();
  const [showSelectInterview, setShowSelectInterview] = useState<boolean>(false);
  const [selectedInterview, setSelectedInterview] = useState<SelectedInterviewType | null>(null);

  const handleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      setShowSignInModal(false);
    } catch (error) {
      toast.error('Sign in error');
      console.error('Sign in error:', error);
    }
  }, [signInWithGoogle]);

  useEffect(() => {
    if (selectedPdf) {
      setShowSelectInterview(true);
    }
  }, [selectedPdf]);

  const handleContinue = useCallback(async () => {
    if (selectedPdf && selectedInterview) {
      const token = session?.access_token;
      const username = session?.user?.user_metadata.full_name;
      if (!token) {
        console.error('User not signed in');
        return;
      }
      try {
        setCreatingInterview(true);
        const response = await createInterview(token, username, selectedPdf.file, selectedInterview, new Date().toLocaleString());
        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) {
            toast.error('Unable to create interview. Client error')
            console.error(`Failed to create interview: Client error (${response.status})`)
            return
          } else if (response.status >= 500) {
            toast.error('Unable to create interview. Server error')
            console.error(`Failed to create interview: Server error (${response.status})`)
            return
          }
          toast.error('Unable to create interview. Unknown error')
          console.error(`Failed to create interview: Unknown error (${response.status})`)
          return
        }

        const interviewResponse = await response.json();
        if (!interviewResponse.data) {
          toast.error('Interview not found');
          console.error('Interview not found');
          return;
        }

        if (interviewResponse.error) {
          toast.error(interviewResponse.error.message);
          console.error('Failed to create interview, Error from server:', interviewResponse.error);
          return;
        }

        setInterview(interviewResponse.data);
      } catch (error) {
        toast.error('Failed to create interview, Unknown error');
        console.error('Failed to create interview, Unknown error:', error);
      } finally {
        setCreatingInterview(false);
        setShowSelectInterview(true);
      }
    }
  }, [session, selectedPdf, selectedInterview]);

  useEffect(() => {
    if (interview) {
      navigate(`/interview/${interview.interview_id}`);
    }
  }, [interview, navigate]);

  useEffect(() => {
    if (!selectedPdf) return
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }, [showSelectInterview, selectedInterview, creatingInterview]);

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-8 py-3 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <CTA />

      <FileUpload
        selectedPdf={selectedPdf}
        setSelectedPdf={setSelectedPdf}
        setShowSignInModal={setShowSignInModal}
      />

      {showSelectInterview && (
        <SelectInterviewSection
          selectedInterview={selectedInterview}
          setSelectedInterview={setSelectedInterview}
        />
      )}


      {selectedPdf && selectedInterview && (
        <div className="flex justify-center my-4">
          <Button
            onClick={handleContinue}
            size="lg"
            className={`min-w-32 disabled:opacity-50 disabled:cursor-not-allowed!`}
            disabled={creatingInterview || !selectedInterview}
          >
            {creatingInterview ? 'Creating Interview...' : 'Continue'}
          </Button>
        </div>
      )}

      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
        handleSignIn={handleSignIn}
        authLoading={authLoading}
      />
    </div>
  );
};

export default memo(Home);
