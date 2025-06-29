import Markdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import rehypeRaw from "rehype-raw"
import { memo } from "react";

const MarkdownRenderer = ({ report }: { report: string | undefined }) => {
    if (!report) return null;
    return (
        <div className="prose dark:prose-invert w-full min-w-full px-2">
            <Markdown
                rehypePlugins={[
                    rehypeRaw,
                    rehypeSanitize,
                ]}

                components={{
                    h1: ({ children }) => <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold my-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold my-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg sm:text-xl lg:text-2xl font-bold my-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-base sm:text-lg lg:text-xl font-bold my-2">{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm sm:text-base lg:text-lg font-bold my-2">{children}</h5>,
                    h6: ({ children }) => <h6 className="text-xs sm:text-sm lg:text-base font-bold my-2">{children}</h6>,
                    p: ({ children }) => <p className="text-sm sm:text-sm lg:text-base my-2">{children}</p>,
                    li: ({ children }) => <li className="text-sm sm:text-sm lg:text-base my-2">{children}</li>,
                }}
            >
                {report}
            </Markdown>
        </div>
    )
}

export default memo(MarkdownRenderer);