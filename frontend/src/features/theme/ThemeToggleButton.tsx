import { forwardRef, type HTMLAttributes } from "react";
import useTheme from "./useTheme";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeToggleButtonProps = HTMLAttributes<HTMLButtonElement> & {
    className?: string;
    iconSize?: number;
};

const ThemeToggleButton = forwardRef<HTMLButtonElement, ThemeToggleButtonProps>(
    ({ className, iconSize = 15, ...rest }, ref) => {
        const { theme, setTheme } = useTheme();
        return (
            <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                ref={ref}
                className={cn("rounded-full size-8 bg-black text-white dark:bg-white dark:text-black flex justify-center items-center colors-smooth", className)}
                {...rest}>
                {theme === "dark" ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
            </button>
        );
    }
);

ThemeToggleButton.displayName = 'ThemeToggleButton';

export default ThemeToggleButton;