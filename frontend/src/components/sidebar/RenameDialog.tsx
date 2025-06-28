import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface RenameDialogProps {
    renameDialogOpen: boolean;
    setRenameDialogOpen: (open: boolean) => void;
    renamingInterviewTitle: string;
    setRenameInput: (input: string) => void;
    handleRenameConfirm: () => void;
    renamingInterview: boolean;
}

const RenameDialog = ({ renameDialogOpen, setRenameDialogOpen, renamingInterviewTitle, setRenameInput, handleRenameConfirm, renamingInterview }: RenameDialogProps) => {
    return (
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Interview</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    <Input type="text" placeholder="Interview Title" value={renamingInterviewTitle} onChange={(e) => setRenameInput(e.target.value)} />
                </DialogDescription>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={renamingInterview}>Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={() => handleRenameConfirm()}
                        disabled={renamingInterview}
                    >{renamingInterview ? 'Renaming...' : 'Rename'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RenameDialog