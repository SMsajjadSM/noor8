import type { Block } from "@/lib/validation/schemas";

/** Renders article blocks as semantic HTML. Shared by the public article page and the admin preview. */
export function ArticleBody({ blocks, resolveSrc = (s) => s }: { blocks: Block[]; resolveSrc?: (src: string) => string }) {
  return (
    <div className="article-body space-y-5 text-[1.05rem] leading-[2.1]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2": return <h2 key={i} id={`s${i}`} className="scroll-mt-24 pt-6 text-2xl font-bold leading-snug">{b.text}</h2>;
          case "h3": return <h3 key={i} id={`s${i}`} className="scroll-mt-24 pt-4 text-xl font-semibold leading-snug">{b.text}</h3>;
          case "p": return <p key={i}>{b.text}</p>;
          case "quote": return <blockquote key={i} className="border-r-4 border-accent bg-surface-2 px-5 py-3 text-muted">{b.text}</blockquote>;
          case "ul": return <ul key={i} className="list-disc space-y-2 pr-6 marker:text-accent">{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>;
          case "ol": return <ol key={i} className="list-decimal space-y-2 pr-6 marker:text-accent">{b.items.map((t, j) => <li key={j}>{t}</li>)}</ol>;
          case "image":
            return (
              <figure key={i} className="my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveSrc(b.src)} alt={b.alt} loading="lazy" className="mx-auto max-h-[32rem] rounded-xl" />
                {b.caption && <figcaption className="mt-2 text-center text-sm text-muted">{b.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </div>
  );
}
