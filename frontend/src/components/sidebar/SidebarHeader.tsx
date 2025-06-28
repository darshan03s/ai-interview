import { memo } from "react";
import { SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";

const SidebarHeader = memo(() => (
    <SheetHeader className='p-0'>
        <SheetTitle className='text-xl font-semibold text-center mt-4'>History</SheetTitle>
        <SheetDescription className='text-xs md:text-sm text-muted-foreground text-center'>
            Your previous interviews will appear here
        </SheetDescription>
    </SheetHeader>
));

SidebarHeader.displayName = 'SidebarHeader';

export default SidebarHeader;