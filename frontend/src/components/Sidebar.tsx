import { SidebarIcon, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getInterviews, deleteInterview, renameInterview } from '@/api'
import type { Interview } from '@/types'
import { useAuth } from '@/features/auth'
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogFooter, DialogClose, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

const Sidebar = () => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null)
    const [renamingInterviewId, setRenamingInterviewId] = useState<string | null>(null)
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [renameDialogOpen, setRenameDialogOpen] = useState(false)
    const { session, authLoading } = useAuth()
    const params = useParams()
    const [renameInput, setRenameInput] = useState<string>('')
    const [renamingInterview, setRenamingInterview] = useState<boolean>(false)
    const [deletingInterview, setDeletingInterview] = useState<boolean>(false)

    const handleDeleteClick = (interview_id: string) => {
        setDeletingInterviewId(interview_id)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!session?.access_token || !deletingInterviewId) return
        try {
            setDeletingInterview(true)
            await deleteInterview(session.access_token, deletingInterviewId)
            setInterviews(interviews.filter(interview => interview.interview_id !== deletingInterviewId))
            setDeleteDialogOpen(false)
            setDeletingInterviewId(null)
        } catch (error) {
            console.error(error)
        } finally {
            setDeletingInterview(false)
        }
    }

    const handleRename = (interview_id: string) => {
        setRenamingInterviewId(interview_id)
        setRenameDialogOpen(true)
    }

    const handleRenameConfirm = async () => {
        if (!session?.access_token || !renamingInterviewId) return
        try {
            setRenamingInterview(true)
            await renameInterview(session.access_token, renamingInterviewId, renameInput)
            setInterviews(interviews.map(interview => interview.interview_id === renamingInterviewId ? { ...interview, title: renameInput } : interview))
            setRenameDialogOpen(false)
            setRenamingInterviewId(null)
        } catch (error) {
            console.error(error)
        } finally {
            setRenamingInterview(false)
        }
    }

    useEffect(() => {
        if (authLoading) return
        const token = session?.access_token
        if (!token) return
        const fetchInterviews = async () => {
            const response = await getInterviews(token);
            const data = await response.json()
            setInterviews(data.interviews)
        };
        fetchInterviews();
    }, [authLoading, params]);

    return (
        <Sheet>
            <SheetTrigger>
                <SidebarIcon className='w-5 h-5 opacity-50' />
            </SheetTrigger>
            <SheetContent side="left" className='w-[300px]'>
                <SheetHeader className='p-0'>
                    <SheetTitle className='text-lg font-semibold text-center mt-4'>History</SheetTitle>
                    <SheetDescription className='text-sm text-muted-foreground text-center'>Your previous interviews will appear here</SheetDescription>
                </SheetHeader>
                <div className="history overflow-y-auto flex flex-col gap-3 hide-scrollbar px-2">
                    {interviews?.length === 0 && (
                        <div className='text-center text-muted-foreground flex items-center justify-center h-[calc(100vh-10rem)]'>
                            No interviews yet
                        </div>
                    )}
                    {interviews.map((interview, index) => (
                        <div key={index} className='history-item group flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200'>
                            <Link to={`/interview/${interview.interview_id}`} className='font-medium text-foreground hover:text-primary transition-colors flex-1 min-w-0'>
                                <span className='truncate block'>{interview.title}</span>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-accent rounded-md'>
                                        <MoreHorizontal className='w-4 h-4' />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className='w-48'>
                                    <DropdownMenuItem onClick={() => handleRename(interview.interview_id)} className='flex items-center gap-2'>
                                        <Edit className='w-4 h-4' />
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDeleteClick(interview.interview_id)}
                                        className='flex items-center gap-2 text-destructive focus:text-destructive'
                                    >
                                        <Trash2 className='w-4 h-4' />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
                <SheetFooter className='flex justify-center items-center p-0 px-2'>
                    <div className='text-sm text-muted-foreground mb-4 flex flex-col items-center gap-2'>
                        <span className='font-bold'>InterviewBot</span>
                        <span className='text-xs text-muted-foreground'>
                            Made by <a href="https://github.com/darshan03s" className='hover:text-primary transition-colors'>Darshan</a>
                        </span>
                    </div>
                </SheetFooter>
            </SheetContent>

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

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Interview</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        <Input type="text" placeholder="Interview Title" value={renameInput} onChange={(e) => setRenameInput(e.target.value)} />
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
        </Sheet>
    )
}

export default Sidebar