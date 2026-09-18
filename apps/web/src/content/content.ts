import { articles, articlePath } from '@/content/articles'

export type MenuLink = {
  label?: string
  title?: string
  href: string
  description?: string
}

export type Menu = {
  trigger: string
  featured?: { href: string; title: string; description: string }
  links: MenuLink[]
}

const featuredArticles = articles.filter((article) => article.featured)

export const siteContent = {
  structuredData: {
    name: 'torseek',
    description: 'Torrent Search Engine',
    uri: 'https://torseek.org',
  },
  metadata: {
    title: 'torseek.org',
    description: 'Torrent Search Engine',
    titleTemplate: '%s | torseek',
  },
  header: {
    menus: [
      {
        trigger: 'Articles',
        links: [
          { label: 'All articles', href: '/articles' },
          ...featuredArticles.slice(0, 5).map((article) => ({
            label: article.navLabel,
            href: articlePath(article.slug),
          })),
        ],
      },
      {
        trigger: 'Resources',
        featured: {
          href: '/articles',
          title: 'Articles',
          description: 'Short guides on how BitTorrent works, how to search here, and how to avoid bad files.',
        },
        links: [
          {
            title: 'How to search',
            href: articlePath('how-to-search-on-torseek'),
            description: 'Writing a query, using the filters, and reading a result.',
          },
          {
            title: 'Spotting fakes',
            href: articlePath('spotting-fake-torrents'),
            description: 'What to check on the listing and in the file list.',
          },
          {
            title: 'Legal torrents',
            href: articlePath('legal-torrents'),
            description: 'Linux ISOs, Internet Archive, Creative Commons releases.',
          },
        ],
      },
    ] as Menu[],
  },
  footer: {
    links: [
      { label: 'Articles', href: '/articles' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Contact', href: '/contact' },
    ],
  },
}
