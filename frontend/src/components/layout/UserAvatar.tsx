import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Session } from "@supabase/supabase-js";
import { memo, useCallback } from "react";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

interface UserAvatarProps {
    session: Session;
    onSignOut: () => void;
}

const UserAvatar = memo(({ session, onSignOut }: UserAvatarProps) => {
    const getUserDisplayName = useCallback(() => {
        if (session?.user?.user_metadata?.full_name) {
            return session.user.user_metadata.full_name;
        }
        if (session?.user?.email) {
            return session.user.email.split('@')[0];
        }
        return 'User';
    }, [session?.user?.user_metadata?.full_name, session?.user?.email]);

    const getUserAvatar = useCallback(() => {
        return session?.user?.user_metadata?.avatar_url ||
            session?.user?.user_metadata?.picture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=random`;
    }, [session?.user?.user_metadata?.avatar_url, session?.user?.user_metadata?.picture, getUserDisplayName]);

    const getInitials = useCallback(() => {
        const name = getUserDisplayName();
        return name
            .split(' ')
            .map((word: string) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, [getUserDisplayName]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={getUserAvatar()}
                            alt={getUserDisplayName()}
                        />
                        <AvatarFallback>
                            {getInitials()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={getUserAvatar()}
                                    alt={getUserDisplayName()}
                                />
                                <AvatarFallback>
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">
                                    {getUserDisplayName()}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                                    {session.user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="p-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;