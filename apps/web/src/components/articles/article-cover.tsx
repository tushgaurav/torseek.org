import type { Article, CoverPalette } from '@/content/articles'
import { cn } from '@/lib/utils'

const PALETTES: Record<CoverPalette, string> = {
  copper: 'from-[#e6bb8c] via-[#a96f45] to-[#472a19]',
  graphite: 'from-[#808080] via-[#3d3d3d] to-[#131313]',
  lavender: 'from-[#d2c5ff] via-[#a696f3] to-[#7d6ce4]',
  moss: 'from-[#b9cb9f] via-[#6e8a5b] to-[#2f4128]',
  slate: 'from-[#adbdd0] via-[#5f7488] to-[#22303c]',
  rose: 'from-[#f2bcbc] via-[#bf6f6e] to-[#532626]',
  sand: 'from-[#ecdcbc] via-[#b7985f] to-[#57432a]',
}

export function ArticleCover({
  article,
  size = 'sm',
  className,
}: {
  article: Article
  size?: 'sm' | 'lg'
  className?: string
}) {
  const large = size === 'lg'
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative aspect-[1.9/1] overflow-hidden bg-linear-to-br',
        large ? 'rounded-xl' : 'rounded-lg',
        PALETTES[article.cover.palette],
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_38%,rgba(255,255,255,0.22)_50%,transparent_62%)]" />
      {large && (
        <span className="absolute top-4 left-4 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
          {article.category}
        </span>
      )}
      <div className={cn('absolute inset-0 flex items-center justify-center', large ? 'p-10' : 'p-6')}>
        <span
          className={cn(
            'text-center font-semibold leading-tight tracking-tight text-balance text-white/90 drop-shadow-sm',
            large ? 'text-4xl sm:text-5xl' : 'text-2xl',
          )}
        >
          {article.cover.label}
        </span>
      </div>
    </div>
  )
}
