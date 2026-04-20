"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "img"],
  attributes: {
    ...(defaultSchema.attributes || {}),
    "*": ["className", "class", "style"],
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
          a: ({ node: _node, target, rel, ...anchorProps }) => {
            const resolvedTarget = target || "_blank";
            const resolvedRel =
              resolvedTarget === "_blank" ? "noopener noreferrer" : rel;
            return (
              <a {...anchorProps} target={resolvedTarget} rel={resolvedRel} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
