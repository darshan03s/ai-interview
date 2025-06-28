import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import type { InterviewType } from '@/types'

interface InterviewItemProps {
    interview: InterviewType;
    isActive: boolean;
    onRename: (interview: InterviewType) => void;
    onDelete: (interview: InterviewType) => void;
}

const InterviewItem = memo(({ interview, isActive, onRename, onDelete }: InterviewItemProps) => {
    return (
        <div className={`history-item group flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200 ${isActive ? 'bg-accent/50 dark:bg-accent/50 text-primary dark:text-primary' : ''}`}>
            <Link
                to={`/interview/${interview.interview_id}`}
                className="font-medium text-foreground hover:text-primary transition-colors flex-1 min-w-0"
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className='truncate block text-sm md:text-base'>
                            {interview.title}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side='top'>
                        {interview.title} <br />
                        Created at - {new Date(interview.created_at).toLocaleString()}
                    </TooltipContent>
                </Tooltip>
            </Link>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-accent rounded-md'>
                        <MoreHorizontal className='w-4 h-4' />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className='w-48'>
                    <DropdownMenuItem onClick={() => onRename(interview)} className='flex items-center gap-2'>
                        <Edit className='w-4 h-4' />
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onDelete(interview)}
                        className='flex items-center gap-2 text-destructive focus:text-destructive'
                    >
                        <Trash2 className='w-4 h-4' />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
});

InterviewItem.displayName = 'InterviewItem';

export default InterviewItem;