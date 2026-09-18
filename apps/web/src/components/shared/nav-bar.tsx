import { Link, NavLink } from 'react-router'

import { ModeToggle } from '@/components/shared/mode-toggle'
import { Button } from '@/components/ui/button'
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
import { siteContent } from '@/content/content'
import { cn } from '@/lib/utils'

export default function NavBar() {
  return (
    <div className="border-b-2 dark:border-accent border-secondary">
      <div className="flex px-6 py-4 items-center gap-4 max-w-screen-2xl mx-auto justify-between">
        <div className="flex gap-4">
          <Link to="/" className="p-1">
            <span className="text-2xl font-bold tracking-tighter hover:text-primary transition-colors">
              torseek
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {siteContent.header.links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(navigationMenuTriggerStyle(), isActive && 'bg-accent/50 text-accent-foreground')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
