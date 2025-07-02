import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from "@vitejs/plugin-react";
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url as string)
const __dirname = path.dirname(__filename)

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunk for React ecosystem
                    vendor: ['react', 'react-dom'],
                    // Router chunk
                    router: ['react-router-dom'],
                    // UI library chunk
                    ui: [
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-tooltip',
                        'lucide-react'
                    ],
                    // Supabase chunk
                    supabase: ['@supabase/supabase-js'],
                    // Markdown and highlighting
                    markdown: [
                        'react-markdown',
                        'rehype-highlight',
                        'rehype-raw',
                        'rehype-sanitize',
                        'remark-gfm'
                    ],
                    // Utilities
                    utils: [
                        'clsx',
                        'class-variance-authority',
                        'tailwind-merge',
                        'next-themes',
                        'sonner'
                    ]
                }
            }
        },
        // Increase chunk size warning limit to 600kb
        chunkSizeWarningLimit: 600,
        // Enable source maps for better debugging (optional)
        sourcemap: false
    }
})
