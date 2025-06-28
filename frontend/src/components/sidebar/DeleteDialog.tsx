import { AlertDialogAction, AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'

interface DeleteDialogProps {
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    deletingInterview: boolean;
    handleDeleteConfirm: () => void;
}

const DeleteDialog = ({ deleteDialogOpen, setDeleteDialogOpen, deletingInterview, handleDeleteConfirm }: DeleteDialogProps) => {
    return (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the interview and remove all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deletingInterview}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className='bg-destructive text-destructive-foreground hover:bg-destructive/90' disabled={deletingInterview}>
                        {deletingInterview ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default DeleteDialog