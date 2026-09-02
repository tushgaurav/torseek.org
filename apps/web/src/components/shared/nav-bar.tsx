import { Link } from 'react-router'

import { ModeToggle } from '@/components/shared/mode-toggle'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { siteContent } from '@/content/content'

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

          <NavigationMenu>
            <NavigationMenuList>
              {siteContent.header.menus.map((menu, index) => (
                <NavigationMenuItem key={`${menu.trigger}-${index}`}>
                  <NavigationMenuTrigger>{menu.trigger}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {menu.featured ? (
                      <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link
                              className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                              to={menu.featured.href}
                            >
                              <div className="mt-4 mb-2 text-lg font-medium">{menu.featured.title}</div>
                              <p className="text-muted-foreground text-sm leading-tight">
                                {menu.featured.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        {menu.links.map((link) => (
                          <ListItem key={link.href + link.title} href={link.href} title={link.title ?? link.label ?? ''}>
                            {link.description}
                          </ListItem>
                        ))}
                      </ul>
                    ) : (
                      <ul className="grid w-[200px] gap-1">
                        {menu.links.map((link) => (
                          <li key={link.href + link.label}>
                            <NavigationMenuLink asChild>
                              <Link to={link.href}>{link.label ?? link.title}</Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
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

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
