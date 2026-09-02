import { Magnet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export default function MagnetLinkButton({ magnetLink }: { magnetLink: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(magnetLink)
        toast.success('Magnet link copied to clipboard.')
      }}
    >
      <Magnet className="size-4" />
      <p>Magnet Link</p>
    </Button>
  )
}
