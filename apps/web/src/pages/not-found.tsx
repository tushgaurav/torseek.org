import { Link } from 'react-router'

import { Page } from '@/components/shared/page'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <Page>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        <p>How'd you get here, nerd?</p>
        <Button asChild className="max-w-30 mt-2">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </Page>
  )
}
