import { Link } from 'react-router'

import { siteContent } from '@/content/content'

export default function Footer() {
  return (
    <footer className="mt-auto border-t-2 dark:border-accent border-secondary bg-background">
      <div className="flex flex-col sm:flex-row px-6 items-center gap-4 max-w-screen-2xl mx-auto justify-between py-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteContent.structuredData.name}. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6 text-sm text-muted-foreground">
          {siteContent.footer.links.map((link) => (
            <Link key={link.href} to={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
