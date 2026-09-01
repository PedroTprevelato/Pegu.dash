import clsx from 'clsx';

export function KpiCard({
  label,
  value,
  tone = 'neutral',
  sublabel,
  variant = 'default',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative';
  sublabel?: string;
  variant?: 'default' | 'hero';
}) {
  if (variant === 'hero') {
    const barColor = tone === 'negative' ? 'bg-negative-500' : 'bg-positive-500';
    const valueColor = tone === 'negative' ? 'text-negative-500' : 'text-ink-100';
    return (
      <div className="card-hero flex">
        <span className={clsx('w-1 shrink-0', barColor)} aria-hidden />
        <div className="px-6 py-6 md:px-8 md:py-7">
          <p className="text-sm text-ink-500">{label}</p>
          <p className={clsx('num text-[40px] md:text-[48px] leading-none font-semibold mt-3', valueColor)}>
            {value}
          </p>
          {sublabel && <p className="text-xs text-ink-500 mt-3">{sublabel}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-ink-500">{label}</p>
      <p
        className={clsx(
          'num text-2xl font-semibold mt-2',
          tone === 'positive' && 'text-positive-500',
          tone === 'negative' && 'text-negative-500',
          tone === 'neutral' && 'text-ink-100'
        )}
      >
        {value}
      </p>
      {sublabel && <p className="text-xs text-ink-500 mt-1.5">{sublabel}</p>}
    </div>
  );
}
