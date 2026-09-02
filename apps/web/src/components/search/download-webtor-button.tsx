import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function DownloadWebtorButton({ infoHash }: { infoHash: string }) {
  return (
    <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
      <a href={`https://webtor.io/${infoHash.toLowerCase()}`} target="_blank" rel="noopener noreferrer">
        <Download className="size-4" />
        <p>Download</p>
      </a>
    </Button>
  )
}
