import { memo } from "react";
import { SheetFooter } from "../ui/sheet";

const SidebarFooter = memo(() => (
    <SheetFooter className='flex justify-center items-center p-0 px-2'>
        <div className='text-sm text-muted-foreground mb-4 flex flex-col items-center gap-2'>
            <span className='font-bold'>InterviewBot</span>
            <span className='text-xs text-muted-foreground'>
                Made by <a href="https://github.com/darshan03s" className='hover:text-primary transition-colors'>Darshan</a>
            </span>
        </div>
    </SheetFooter>
));

SidebarFooter.displayName = 'SidebarFooter';

export default SidebarFooter;