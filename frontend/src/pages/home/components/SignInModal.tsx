import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { memo } from 'react';

interface SignInModalProps {
    showSignInModal: boolean;
    setShowSignInModal: (show: boolean) => void;
    handleSignIn: () => void;
    authLoading: boolean;
}

const SignInModal = ({ showSignInModal, setShowSignInModal, handleSignIn, authLoading }: SignInModalProps) => {
    return (
        <>
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
        </>
    )
}

export default memo(SignInModal)