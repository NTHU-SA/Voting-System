"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "img"],
  attributes: {
    ...(defaultSchema.attributes || {}),
    img: [
      ...(defaultSchema.attributes?.img || []),
      "src",
      "alt",
      "title",
      "width",
      "height",
      "loading",
      "decoding",
    ],
    a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
  },
  protocols: {
    ...(defaultSchema.protocols || {}),
    src: ["http", "https", "data"],
    href: ["http", "https", "mailto", "tel"],
  },
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          a: (props) => {
            const target = props.target || "_blank";
            const rel = target === "_blank" ? "noopener noreferrer" : props.rel;
            return <a {...props} target={target} rel={rel} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
