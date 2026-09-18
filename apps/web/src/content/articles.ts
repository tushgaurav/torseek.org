export type ArticleCategory = 'Guide' | 'Protocol' | 'Safety' | 'Legal'

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'note'; title: string; text: string }

export type CoverPalette = 'copper' | 'graphite' | 'lavender' | 'moss' | 'slate' | 'rose' | 'sand'

export type Article = {
  slug: string
  title: string
  navLabel: string
  description: string
  category: ArticleCategory
  cover: { label: string; palette: CoverPalette }
  publishedAt: string
  featured?: boolean
  body: ArticleBlock[]
}

export const articlePath = (slug: string) => `/articles/${slug}`

export const categories: ArticleCategory[] = ['Guide', 'Protocol', 'Safety', 'Legal']

const allArticles: Article[] = [
  {
    slug: 'how-to-search-on-torseek',
    title: 'How to search on torseek',
    navLabel: 'Searching on torseek',
    description: 'Queries, categories, indexers, and how to read a result row without getting lost.',
    category: 'Guide',
    cover: { label: 'Searching on torseek', palette: 'lavender' },
    publishedAt: '2026-09-18',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'torseek is a search box in front of many torrent indexers at once. You type a query, it asks those indexers, and it shows a merged list. Nothing is hosted here: a result is a pointer (usually a magnet link) to a swarm that already exists on the BitTorrent network.',
      },
      { type: 'h2', text: 'Start with a precise query' },
      {
        type: 'p',
        text: 'Short, specific queries beat long ones. A title plus a year, a resolution, or a distro version is usually enough. If you know a release group or an ISO name, use that. Filler words (`the`, `official`, `download`) mostly add noise.',
      },
      {
        type: 'ul',
        items: [
          'Prefer `ubuntu 24.04 iso` over `ubuntu linux operating system torrent`.',
          'Add a year when titles collide (`blade runner 1982` vs `blade runner 2049`).',
          'If the first page is junk, tighten the query before paging further.',
        ],
      },
      { type: 'h2', text: 'Filters that actually help' },
      {
        type: 'p',
        text: 'Use a **category** when you know the kind of file you want (movies, TV, software, books). Categories come from the indexers; they are hints, not a guarantee. Use **indexers** to restrict which sites are queried if you already trust a subset, or to drop one that keeps returning garbage.',
      },
      {
        type: 'p',
        text: '**Sort** defaults to relevance. Switch to seeders when you care more about a living swarm than a close name match. Size-based sorts help when you are hunting a particular encode, not when you are still identifying the right title.',
      },
      { type: 'h2', text: 'Reading a result' },
      {
        type: 'p',
        text: 'Each row is a listing from one indexer. The indexer name tells you where the metadata came from. **Size** is the payload. **Seeders** are peers with the complete file; **peers** here means leechers still downloading. A magnet button copies or opens the magnet; if an indexer only offered a `.torrent` file through Jackett, that URL is withheld because it would leak API credentials.',
      },
      {
        type: 'note',
        title: 'Seeders are a health check, not a quality score',
        text: 'A 2 GiB file with 80 seeders is almost always a better bet than a 40 GiB file with 1 seeder, even if the giant one looks “more complete.” Dead listings linger. Sort by seeders when in doubt.',
      },
      { type: 'h2', text: 'What torseek does not do' },
      {
        type: 'p',
        text: 'It does not store torrents, proxy downloads, or vouch for the files behind a magnet. Two listings with similar names can be different files. Read [Spotting fake torrents](/articles/spotting-fake-torrents) before you add anything to a client, and prefer [legal, openly licensed releases](/articles/legal-torrents) when you can.',
      },
    ],
  },
  {
    slug: 'how-bittorrent-works',
    title: 'How BitTorrent actually works',
    navLabel: 'How BitTorrent works',
    description: 'Pieces, swarms, trackers, and why your client talks to other people instead of a single server.',
    category: 'Protocol',
    cover: { label: 'How BitTorrent Works', palette: 'graphite' },
    publishedAt: '2026-09-16',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'HTTP download is a conversation with one host: you ask, it sends the bytes. BitTorrent is a conversation with a crowd. A file is split into pieces. Anyone who has a piece can send it to anyone who needs it. The group of peers working on the same file is the **swarm**.',
      },
      { type: 'h2', text: 'The file is not the torrent' },
      {
        type: 'p',
        text: 'A `.torrent` file (or a magnet link) is metadata. It names the payload, lists piece hashes, and tells your client how to find the swarm. The actual bytes never live “in” the torrent. They live on peers. That is why a popular Linux ISO stays fast years later: new downloaders become new seeders.',
      },
      {
        type: 'p',
        text: 'Each piece has a hash. After a piece arrives, the client checks it. A bad piece is thrown away and fetched again from someone else. That is the main reason random strangers can send you data without a central CDN signing every byte.',
      },
      { type: 'h2', text: 'Finding the swarm' },
      {
        type: 'p',
        text: 'Your client still has to discover peers. Classic torrents list **trackers**: HTTP or UDP servers that keep a roster of who is in the swarm. Many swarms also use **DHT** (a distributed hash table of peers) and **PEX** (peers telling you about other peers). Magnet links lean on those because they may not include a tracker list at all. See [Magnet links vs torrent files](/articles/magnet-links-vs-torrent-files) for the difference.',
      },
      { type: 'h2', text: 'Tit for tat' },
      {
        type: 'p',
        text: 'Clients are not charities. The usual policy is optimistic unchoking plus tit-for-tat: you upload to peers who upload to you, and you occasionally try a new peer in case they are fast. That is why a swarm with only leechers stalls, and why people still talk about ratio even on public torrents. More in [Seeders, leechers, and swarm health](/articles/seeders-leechers-and-ratio).',
      },
      {
        type: 'note',
        title: 'Your IP is part of the protocol',
        text: 'Peers must know where to send pieces. BitTorrent exposes your IP address to the swarm by design. That is not a bug in your client. Read [Privacy basics for torrenting](/articles/privacy-basics-for-torrenting) if you want the implications, not a magic off switch.',
      },
      { type: 'h2', text: 'What “done” means' },
      {
        type: 'p',
        text: 'When every piece verifies, you have the file. If you keep the torrent active without leaving, you are seeding: you have the complete set and you keep serving pieces. Seeding is what makes the next person\'s download possible. Stopping at 100% is allowed; it is also how swarms die.',
      },
    ],
  },
  {
    slug: 'magnet-links-vs-torrent-files',
    title: 'Magnet links vs .torrent files',
    navLabel: 'Magnet vs torrent files',
    description: 'Same swarm, different handshake. Why magnets took over, and when a .torrent file still matters.',
    category: 'Protocol',
    cover: { label: 'Magnets vs .torrent Files', palette: 'copper' },
    publishedAt: '2026-09-14',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'Both a magnet link and a `.torrent` file are invitations to the same kind of swarm. They are not the download. They tell a client the **info hash** — a fingerprint of the torrent metadata — so it can find peers who share that exact payload.',
      },
      { type: 'h2', text: 'What a .torrent file contains' },
      {
        type: 'p',
        text: 'A torrent file is a small bencoded blob. It has the name, piece length, piece hashes, file list, and usually a list of trackers. Your client reads it from disk and already knows the shape of the download before it talks to anyone. That is handy when DHT is blocked or you want to inspect the file list first.',
      },
      { type: 'h2', text: 'What a magnet is' },
      {
        type: 'p',
        text: 'A magnet is a URL. The important parameter is `xt=urn:btih:…`, the info hash. Optional parameters add a display name (`dn`) and trackers (`tr`). Everything else — piece hashes, file names, sizes — is fetched from peers after you join, via metadata exchange (BEP 9). Until that arrives, the client only knows “this hash.”',
      },
      {
        type: 'ul',
        items: [
          'Magnets are easy to copy, paste, and share. No file to host.',
          'They depend on DHT or at least one peer who still has the metadata.',
          'A `.torrent` file still wins when you need the file list before connecting.',
        ],
      },
      {
        type: 'note',
        title: 'Same hash, same files',
        text: 'If two magnets or torrent files share an info hash, they describe the same piece set. If the hash differs, they are different torrents even if the titles match. Titles lie; hashes do not.',
      },
      { type: 'h2', text: 'What you will see on torseek' },
      {
        type: 'p',
        text: 'Most results expose a magnet. Some indexers only give a download URL for a `.torrent` file, and those URLs often go through Jackett with an API key in the query string. torseek does not pass those through. If a row has no magnet and no info hash, there is nothing safe to hand your client. Try another indexer, or a listing that already has a magnet.',
      },
    ],
  },
  {
    slug: 'seeders-leechers-and-ratio',
    title: 'Seeders, leechers, and swarm health',
    navLabel: 'Seeders and leechers',
    description: 'How to tell a living swarm from a ghost, and what ratio is actually measuring.',
    category: 'Guide',
    cover: { label: 'Swarm Health', palette: 'moss' },
    publishedAt: '2026-09-12',
    featured: true,
    body: [
      {
        type: 'p',
        text: '**Seeders** have every piece and are still connected. **Leechers** (shown as peers on torseek) are still missing pieces. A swarm with seeders can usually finish. A swarm with only leechers can deadlock: everyone is missing a different last piece, or the same rare piece, and nobody can invent bytes that were never hashed into the torrent.',
      },
      { type: 'h2', text: 'Numbers that mean something' },
      {
        type: 'ul',
        items: [
          'Seeders = 0: treat it as dead unless you like waiting on a miracle.',
          'Seeders in the single digits: it might finish, slowly, and it might vanish tomorrow.',
          'Healthy public swarms often have tens or hundreds of seeders. Popular Linux ISOs have thousands.',
        ],
      },
      {
        type: 'p',
        text: 'Indexer counts are snapshots, and they disagree with each other. One site might report 40 seeders while another reports 8 for what looks like the same name. Different info hashes are different swarms. Even the same hash can show stale counts. Use the number as a filter, then let your client tell you the truth after it connects.',
      },
      { type: 'h2', text: 'Ratio' },
      {
        type: 'p',
        text: 'Ratio is uploaded bytes divided by downloaded bytes for that torrent (or across your client). A ratio of 1.0 means you sent as much as you received. Public torrents rarely enforce it. Private trackers often do: they want the swarm to survive after the initial rush.',
      },
      {
        type: 'p',
        text: 'Even without a tracker watching, seeding for a while is the difference between “I got my file” and “the next person can too.” Leave a finished torrent running if you have the disk and the bandwidth. You do not need a number in mind; a few hours on a busy swarm is already useful.',
      },
      {
        type: 'note',
        title: 'Partial files are normal',
        text: 'Leechers upload pieces they already have. You will send data before you reach 100%. That is the protocol working, not your client “leaking” the download.',
      },
    ],
  },
  {
    slug: 'spotting-fake-torrents',
    title: 'Spotting fake torrents',
    navLabel: 'Spotting fake torrents',
    description: 'Wrong sizes, nested archives, extra executables, and other tells before you click magnet.',
    category: 'Safety',
    cover: { label: 'Spotting Fakes', palette: 'rose' },
    publishedAt: '2026-09-10',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'A magnet is not a review. Anyone can publish a listing whose title looks right and whose payload is something else. BitTorrent will faithfully deliver whatever was hashed — malware included. The protocol verifies pieces against the torrent, not against the title on the search page.',
      },
      { type: 'h2', text: 'Tells in the listing' },
      {
        type: 'ul',
        items: [
          'Size is wildly off. A Linux ISO that should be ~5 GiB showing as 40 MiB, or a small utility showing as 12 GiB.',
          'Title stuffed with keywords that do not belong together.',
          'Zero seeders and a recent publish date, or the opposite: an old listing with suddenly huge seeder counts that no other indexer repeats.',
          'Uploader name that is a random string, or that impersonates a known group with a one-character swap.',
        ],
      },
      { type: 'h2', text: 'Tells in the file list' },
      {
        type: 'p',
        text: 'Once the metadata is in your client, look at the files before you start the download (or pause immediately). You want the payload you expected: an `.iso`, a media file, a source tarball. Be suspicious of:',
      },
      {
        type: 'ul',
        items: [
          'Extra `.exe`, `.scr`, `.js`, or `.bat` files sitting next to a movie or an ISO.',
          'A tiny installer plus a “password in the nfo” for a zip that hosts the real file on some unrelated site.',
          'Nested archives (`file.zip` inside `file.rar`) whose only purpose is to hide contents from a quick glance.',
          'A single executable named after a film, game, or PDF.',
        ],
      },
      {
        type: 'note',
        title: 'Hash mismatch is not the usual scam',
        text: 'Piece hashes stop bit-flips and most tampering in transit. They do not stop a torrent that was malicious from the start. A “valid” torrent can still be a bad file.',
      },
      { type: 'h2', text: 'What to do instead' },
      {
        type: 'p',
        text: 'Prefer sources that publish checksums on their own site — Linux distros, Blender, Wikimedia dumps. Cross-check the info hash or a SHA-256 of the finished file against that site, not against another random listing. If you cannot verify it, do not run it. Search is cheap; cleanup is not.',
      },
    ],
  },
  {
    slug: 'legal-torrents',
    title: 'Legal torrents and open content',
    navLabel: 'Legal torrents',
    description: 'Linux ISOs, Creative Commons, public domain, and other swarms that are supposed to exist.',
    category: 'Legal',
    cover: { label: 'Legal Torrents', palette: 'slate' },
    publishedAt: '2026-09-08',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'BitTorrent is a distribution protocol. It does not know or care about copyright. Plenty of projects use it on purpose because it is an efficient way to ship large files to a lot of people without paying CDN prices. Those are the swarms this article is about.',
      },
      {
        type: 'note',
        title: 'The obvious disclaimer',
        text: 'Downloading or sharing copyrighted work without permission is illegal in most places. torseek is a search engine, not a license. If you do not have the right to the file, do not take it.',
      },
      { type: 'h2', text: 'Operating systems' },
      {
        type: 'p',
        text: 'Most Linux distributions publish official torrents: Ubuntu, Debian, Fedora, Arch, Linux Mint, and many others. The project site is the source of truth for the magnet or `.torrent` and for checksums. After the download, verify the ISO before you write it to a USB drive.',
      },
      { type: 'h2', text: 'Creative Commons and public domain' },
      {
        type: 'p',
        text: 'Films, albums, and books released under Creative Commons or into the public domain are often seeded on purpose. Blender Foundation open movies, Internet Archive collections, and various remix-friendly labels still use torrents because the files are large and the audience is scattered. Check the license on the project page, not the indexer title.',
      },
      { type: 'h2', text: 'Data, games, and other legitimately opened files' },
      {
        type: 'ul',
        items: [
          'Open data dumps (Wikimedia, some government and scientific sets) where the publisher posted a torrent.',
          'Open-source games and engine demos whose authors linked a torrent next to the HTTP mirror.',
          'Academic datasets that are too large for a polite HTTP mirror.',
        ],
      },
      {
        type: 'p',
        text: 'If the official site offers both HTTPS and a torrent, the torrent is usually there to save them bandwidth, not to hide the file. Use their hash. Ignore lookalike listings with the same name and a different size.',
      },
    ],
  },
  {
    slug: 'what-is-an-indexer',
    title: 'What is a torrent indexer?',
    navLabel: 'What is an indexer',
    description: 'Indexers list torrents. They do not host the files. Here is how that split works, and where Jackett fits.',
    category: 'Guide',
    cover: { label: 'What Is an Indexer', palette: 'sand' },
    publishedAt: '2026-09-06',
    body: [
      {
        type: 'p',
        text: 'An **indexer** is a catalog. It stores titles, sizes, magnet links or torrent files, and whatever else the site tracks (seeders, uploaders, categories). It does not store the movie, the ISO, or the book. When you “download from” an indexer, you are usually fetching metadata so your client can join a swarm of peers.',
      },
      { type: 'h2', text: 'Why there are so many' },
      {
        type: 'p',
        text: 'Anyone can run a site that lists magnets. They go up, they get sued, they vanish, they clone themselves. Public indexers overlap a lot and contradict each other on seeder counts. Private trackers are membership communities with rules and ratio requirements; they are a different beast and torseek is not a way around their gates.',
      },
      { type: 'h2', text: 'Jackett' },
      {
        type: 'p',
        text: 'torseek talks to [Jackett](https://github.com/Jackett/Jackett), a self-hosted proxy that speaks a common API (Torznab) in front of many indexers. You add indexers in Jackett; torseek queries the ones that are configured. That is why the indexer filter in search only lists what the backend actually has.',
      },
      {
        type: 'p',
        text: 'If Jackett is down or has no indexers, search has nothing to merge. The API can also serve fixture results in development so the UI can be built without a live Jackett. Production search is only as complete as the configured indexers.',
      },
      { type: 'h2', text: 'How to use that as a searcher' },
      {
        type: 'ul',
        items: [
          'Do not assume every indexer has every file. Repeat titles across indexers are normal.',
          'If one indexer is all spam, exclude it rather than giving up on the query.',
          'Treat the indexer name as provenance for the listing, not as a guarantee of the payload.',
        ],
      },
    ],
  },
  {
    slug: 'choosing-a-torrent-client',
    title: 'Choosing a torrent client',
    navLabel: 'Choosing a client',
    description: 'What a client must do, what is worth configuring, and a few names that are not adware.',
    category: 'Guide',
    cover: { label: 'Choosing a Client', palette: 'graphite' },
    publishedAt: '2026-09-04',
    body: [
      {
        type: 'p',
        text: 'A torrent client speaks BitTorrent: it reads a magnet or `.torrent`, finds peers, verifies pieces, and writes files to disk. The protocol is the same across good clients. The differences are UI, defaults, and whether the installer tries to sell you a VPN halfway through setup.',
      },
      { type: 'h2', text: 'Pick something maintained' },
      {
        type: 'ul',
        items: [
          '**qBittorrent** — open source, no ads, familiar feature set (search plugins, sequential download, web UI).',
          '**Transmission** — small, common on macOS and Linux, fewer knobs.',
          '**Deluge** — daemon plus optional GTK or web UI, useful if you want the client on a server.',
        ],
      },
      {
        type: 'p',
        text: 'Avoid random “free downloader” brands that bundle toolbars or rewrite your search engine. The official project site is the download location. If an ad told you where to get the client, it is probably the wrong client.',
      },
      { type: 'h2', text: 'Settings that matter' },
      {
        type: 'ol',
        items: [
          'Download folder on a disk with space. Torrents pause in ugly ways when the disk fills up.',
          'Port forwarding if you can. A reachable port helps you connect to more peers. UPnP is the lazy version; a forwarded port is more reliable.',
          'Encryption and DHT/PEX left on unless you have a specific reason to turn them off.',
          'A reasonable upload cap so the rest of the house can still use the internet. Uncapped upload is polite to the swarm and rude to everyone on your LAN.',
        ],
      },
      {
        type: 'note',
        title: 'Sequential download',
        text: 'Most clients can fetch pieces in order so a media file becomes playable early. It is worse for the swarm (rare pieces stay rare). Use it as a convenience, not as the default for everything.',
      },
      {
        type: 'p',
        text: 'After it is installed, try a known-good file — an official distro ISO — and confirm the checksum. That checks the client, your network, and your habits before you trust it with anything messier.',
      },
    ],
  },
  {
    slug: 'privacy-basics-for-torrenting',
    title: 'Privacy basics for torrenting',
    navLabel: 'Privacy basics',
    description: 'BitTorrent shares your IP with the swarm. Here is what that means, without the usual folklore.',
    category: 'Safety',
    cover: { label: 'Privacy Basics', palette: 'slate' },
    publishedAt: '2026-09-02',
    body: [
      {
        type: 'p',
        text: 'Peers send pieces to each other. To do that they need an address. Your IP is visible to everyone in the swarm, to trackers you announce on, and to anyone logging DHT. That is how the protocol is built. No client setting named “private mode” removes you from the mesh while still letting you download.',
      },
      { type: 'h2', text: 'What other people can see' },
      {
        type: 'ul',
        items: [
          'That you are connected to a particular info hash.',
          'Your IP and port, and roughly how much you are uploading or downloading.',
          'Nothing about other torrents in your client, unless you are in those swarms too.',
        ],
      },
      {
        type: 'p',
        text: 'If the torrent is an Ubuntu ISO, that is a boring fact. If it is something you are not allowed to copy, it is also evidence. Copyright holders and their contractors join swarms on purpose to collect IPs. A VPN or seedbox changes which IP the swarm sees; it does not make an unauthorized copy legal. See [Legal torrents](/articles/legal-torrents).',
      },
      { type: 'h2', text: 'Practical hygiene' },
      {
        type: 'ol',
        items: [
          'Do not torrent on networks you do not control (work, school, café) unless you like explaining yourself.',
          'Keep the client’s web UI bound to localhost unless you know why you are exposing it.',
          'Treat random `.exe` companions as hostile. Privacy tools do not help if you run the payload. [Spotting fake torrents](/articles/spotting-fake-torrents) is the better first step.',
          'If you use a VPN, pick one you pay for, enable a kill switch, and verify the IP the swarm sees. Free VPNs have their own business model.',
        ],
      },
      {
        type: 'note',
        title: 'Private trackers are not invisible',
        text: '“Private” in BitTorrent usually means the torrent has the private flag: DHT and PEX are off, and you are expected to use the tracker’s peer list. Other members of that tracker can still see you. It is access control, not a cloak.',
      },
    ],
  },
]

export const articles: Article[] = [...allArticles].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
)

export function getArticle(slug: string | undefined): Article | undefined {
  if (!slug) return undefined
  return articles.find((article) => article.slug === slug)
}

export function relatedArticles(slug: string, limit = 3): Article[] {
  const current = getArticle(slug)
  const rest = articles.filter((article) => article.slug !== slug)
  if (!current) return rest.slice(0, limit)
  const same = rest.filter((article) => article.category === current.category)
  const other = rest.filter((article) => article.category !== current.category)
  return [...same, ...other].slice(0, limit)
}

export type Section = { id: string; title: string }

export const INTRO_ID = 'overview'

export function sectionId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Title plus every h2, in reading order, for the on-page table of contents. */
export function articleSections(article: Article): Section[] {
  return [
    { id: INTRO_ID, title: article.title },
    ...article.body
      .filter((block): block is Extract<ArticleBlock, { type: 'h2' }> => block.type === 'h2')
      .map((block) => ({ id: sectionId(block.text), title: block.text })),
  ]
}

export function wordCount(article: Article): number {
  return article.body.reduce((total, block) => {
    if (block.type === 'p' || block.type === 'h2' || block.type === 'note') {
      return total + block.text.split(/\s+/).length
    }
    return total + block.items.join(' ').split(/\s+/).length
  }, 0)
}

export function readingMinutes(article: Article): number {
  return Math.max(1, Math.round(wordCount(article) / 220))
}

export function formatArticleDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
