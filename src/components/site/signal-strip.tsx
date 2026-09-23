export interface StripItem {
  title: string;
  url: string;
  categoryName: string;
  color: string;
}

interface SignalStripProps {
  items: StripItem[];
}

export function SignalStrip({ items }: SignalStripProps) {
  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="signal-marquee overflow-hidden border-b bg-ink text-paper">
      <div className="px-4">
        <div className="signal-marquee-track flex w-max items-center gap-8 py-2 text-sm">
          {doubled.map((item, index) => (
            <a
              key={`${item.url}-${index}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap text-paper/90 transition-colors hover:text-paper"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-paper/60">{item.categoryName}</span>
              <span className="line-clamp-1 max-w-72">{item.title}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}