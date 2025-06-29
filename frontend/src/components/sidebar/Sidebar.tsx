import { SidebarIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getInterviews, deleteInterview, renameInterview } from '@/api'
import type { InterviewType } from '@/types'
import { useAuth } from '@/features/auth'
import { toast } from 'sonner'
import InterviewItem from './Interviewitem'
import SidebarHeader from './SidebarHeader'
import SidebarFooter from './SidebarFooter'
import EmptyState from './EmptyState'
import DeleteDialog from './DeleteDialog'
import RenameDialog from './RenameDialog'

const Sidebar = () => {
    const { session, authLoading } = useAuth()
    const { interviewId } = useParams()
    const navigate = useNavigate()

    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null)
    const [deletingInterview, setDeletingInterview] = useState<boolean>(false)
    const [renamingInterviewId, setRenamingInterviewId] = useState<string | null>(null)
    const [renamingInterview, setRenamingInterview] = useState<boolean>(false)
    const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false)
    const [interviews, setInterviews] = useState<InterviewType[]>([])
    const [renameInput, setRenameInput] = useState<string>('')
    const [fetchingInterviews, setFetchingInterviews] = useState<boolean>(false)

    const handleDeleteClick = (interview: InterviewType) => {
        setDeletingInterviewId(interview.interview_id)
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
            if (interviewId === deletingInterviewId) {
                navigate('/')
            }
        }
    }

    const handleRename = (interview: InterviewType) => {
        setRenamingInterviewId(interview.interview_id)
        setRenameInput(interview.title)
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
            try {
                setFetchingInterviews(true)
                const response = await getInterviews(token);
                if (!response.ok) {
                    if (response.status >= 400 && response.status < 500) {
                        toast.error('Unable to fetch interviews. Client error')
                        console.error(`Failed to fetch interviews: Client error (${response.status})`)
                        return
                    } else if (response.status >= 500) {
                        toast.error('Unable to fetch interviews. Server error')
                        console.error(`Failed to fetch interviews: Server error (${response.status})`)
                        return
                    }
                    toast.error('Unable to fetch interviews. Unknown error')
                    console.error(`Failed to fetch interviews: Unknown error (${response.status})`)
                    return
                }
                const data = await response.json()
                if (!data) {
                    toast.error('Failed to fetch interviews, No data received from server')
                    console.error('Failed to fetch interviews, No data received from server')
                    return
                }
                if (data.error) {
                    toast.error(data.error.message)
                    console.error(data.error.message)
                    return
                }
                setInterviews(data.data)
            } catch (error) {
                toast.error('Unable to fetch interviews. Unknown error')
                console.error('Unable to fetch interviews. Unknown error', error)
            } finally {
                setFetchingInterviews(false)
            }
        };
        fetchInterviews();
    }, [authLoading, session?.access_token]);

    return (
        <Sheet>
            <SheetTrigger>
                <SidebarIcon className='w-5 h-5 opacity-50' />
            </SheetTrigger>
            <SheetContent side="left" className='w-[300px]'>
                <SidebarHeader />
                <div className="history overflow-y-auto flex flex-col gap-3 hide-scrollbar px-2">
                    {interviews?.length === 0 ? (
                        <EmptyState fetchingInterviews={fetchingInterviews} />
                    ) : (
                        interviews.map((interview) => (
                            <InterviewItem
                                key={interview.interview_id}
                                interview={interview}
                                isActive={interviewId === interview.interview_id}
                                onRename={handleRename}
                                onDelete={handleDeleteClick}
                            />
                        ))
                    )}
                </div>
                <SidebarFooter />
            </SheetContent>

            <DeleteDialog
                deleteDialogOpen={deleteDialogOpen}
                setDeleteDialogOpen={setDeleteDialogOpen}
                deletingInterview={deletingInterview}
                handleDeleteConfirm={handleDeleteConfirm}
            />

            <RenameDialog
                renameDialogOpen={renameDialogOpen}
                setRenameDialogOpen={setRenameDialogOpen}
                renamingInterviewTitle={renameInput}
                setRenameInput={setRenameInput}
                handleRenameConfirm={handleRenameConfirm}
                renamingInterview={renamingInterview}
            />
        </Sheet>
    )
}

export default Sidebar