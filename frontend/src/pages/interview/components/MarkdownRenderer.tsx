import Markdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import rehypeRaw from "rehype-raw"

const MarkdownRenderer = ({ report }: { report: string | null }) => {
    if (!report) return null;
    return (
        <div className="prose dark:prose-invert w-full min-w-full px-2">
            <Markdown
                rehypePlugins={[
                    rehypeRaw,
                    rehypeSanitize,
                ]}

                components={{
                    h1: ({ children }) => <h1 className="text-4xl font-bold my-2!">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-3xl font-bold my-2!">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-2xl font-bold my-2!">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-xl font-bold my-2!">{children}</h4>,
                    h5: ({ children }) => <h5 className="text-lg font-bold my-2!">{children}</h5>,
                    h6: ({ children }) => <h6 className="text-base font-bold my-2!">{children}</h6>,
                    p: ({ children }) => <p className="my-2!">{children}</p>,

                }}
            >
                {report}
            </Markdown>
        </div>
    )
}

export default MarkdownRenderer