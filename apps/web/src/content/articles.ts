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
    description: 'What the search box does, what the filters mean, and how to read a result before you open it.',
    category: 'Guide',
    cover: { label: 'Searching on torseek', palette: 'lavender' },
    publishedAt: '2026-09-18',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'torseek doesn’t host anything. When you search, the query goes out to a set of torrent indexers through Jackett, the responses are merged into one list, and each row links to a magnet that your own client downloads. Everything on the results page is metadata that other sites published. The files themselves live with the people seeding them.',
      },
      { type: 'h2', text: 'Writing a query' },
      {
        type: 'p',
        text: 'Indexers do fairly simple text matching on titles, so the query that works best is the one that looks most like a release name. Put in the title and one distinguishing detail: a year, a season and episode, a version number, a resolution. Leave out words like “download”, “free”, or “torrent”. They aren’t in the title, so they only get in the way.',
      },
      {
        type: 'ul',
        items: [
          '`debian 12 netinst` finds the installer. `debian linux iso download free` mostly finds junk.',
          'For films that have been remade, add the year. For TV, `S02E05` is the convention most uploaders follow.',
          'If a query returns nothing, try fewer words before you try different ones.',
        ],
      },
      { type: 'h2', text: 'Filters' },
      {
        type: 'p',
        text: '**Category** narrows results to one of the standard Torznab groups: Movies, TV, Audio, PC, Console, Books, and so on. Each indexer maps its own categories onto these, and they don’t always do it well, so a category filter can hide things that were labelled oddly. Reach for it when a query is drowning in the wrong kind of result rather than by default.',
      },
      {
        type: 'p',
        text: '**Indexers** picks which sites are asked. The default is all of them. If one indexer keeps returning spam for your query, untick it. The list only shows indexers that are actually configured on the backend, so it may be shorter than you expect.',
      },
      {
        type: 'p',
        text: '**Sort** defaults to relevance, which is the order Jackett returned. The other options re-sort the merged list by seeders, peers, size, or date. “Most seeders” is the useful one when you have several near-identical listings and want the one that will actually finish.',
      },
      { type: 'h2', text: 'Reading a row' },
      {
        type: 'p',
        text: 'Each result shows the indexer it came from, the size, the seeder and peer counts, how long ago it was published, and, where the indexer supplies it, the uploader’s name.',
      },
      {
        type: 'p',
        text: 'Seeders are peers with the whole file. The peers figure is whatever the indexer reported as its total, and for most Jackett indexers that includes the seeders, so it’s normally the larger of the two. Both are snapshots taken whenever the indexer last checked, not live counts. Two indexers can show quite different numbers for the same torrent.',
      },
      {
        type: 'p',
        text: 'Clicking the title opens the magnet in whatever client is registered for `magnet:` links. **Magnet link** copies it to the clipboard instead. **Download** appears when the listing has an info hash and opens the torrent in webtor.io, a client that runs in the browser, which is handy for checking the file list without adding anything locally.',
      },
      {
        type: 'note',
        title: 'Rows without a magnet',
        text: 'Some indexers only publish a `.torrent` file, and Jackett serves those through a URL that contains its API key. torseek strips those URLs rather than expose the key. If the indexer also gave an info hash you still get the Download button; if not, the row says “No magnet available” and your best bet is the same title on another indexer.',
      },
      { type: 'h2', text: 'Before you download' },
      {
        type: 'p',
        text: 'Compare listings before picking one. A size that’s far off from other copies of the same title, a single seeder, or a fresh upload no other indexer repeats are all worth a second look. [Spotting fake torrents](/articles/spotting-fake-torrents) goes through the common tells. And if what you want is an OS image or an openly licensed film, the project’s own site will list an official torrent with a checksum; [Legal torrents](/articles/legal-torrents) has examples.',
      },
    ],
  },
  {
    slug: 'how-bittorrent-works',
    title: 'How BitTorrent actually works',
    navLabel: 'How BitTorrent works',
    description: 'Pieces, swarms, trackers and DHT, and why downloading from strangers is safe enough to work at all.',
    category: 'Protocol',
    cover: { label: 'How BitTorrent Works', palette: 'graphite' },
    publishedAt: '2026-09-16',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'A normal download is one connection to one server. BitTorrent splits a file into fixed-size pieces and lets everyone who has a piece send it to anyone who needs it. The group of clients working on the same file is called a swarm. A busy swarm can move data faster than any single server because every downloader is also uploading.',
      },
      { type: 'h2', text: 'The torrent is metadata, not the file' },
      {
        type: 'p',
        text: 'A `.torrent` file describes the download: file names and sizes, the piece length (usually somewhere between 256 KiB and a few MiB), a SHA-1 hash of every piece, and normally a list of trackers. A magnet link carries less, mainly a hash of that description, and the client fetches the rest from peers. Neither one contains any of the actual data.',
      },
      {
        type: 'p',
        text: 'The piece hashes are what make downloading from unknown peers workable. When a piece arrives, the client hashes it and compares. If it doesn’t match, the piece is thrown away and requested again from someone else. A peer can be slow or vanish halfway through, but it can’t quietly hand you a corrupted piece.',
      },
      { type: 'h2', text: 'Finding peers' },
      {
        type: 'p',
        text: 'Before it can download anything, a client needs addresses. There are three ways it gets them, and most clients use all three at once.',
      },
      {
        type: 'ul',
        items: [
          '**Trackers** are servers listed in the torrent. The client announces itself and gets back a list of other peers. Trackers don’t carry file data; they only keep the roster.',
          '**DHT** (BEP 5) is a distributed table where clients store and look up peers by info hash, with no central server involved. It’s why a magnet link with no tracker still works.',
          '**PEX** (BEP 11) is peers swapping their peer lists directly once they’re connected.',
        ],
      },
      { type: 'h2', text: 'Who sends what to whom' },
      {
        type: 'p',
        text: 'A client can only upload to so many peers at once, so it has to choose. The standard approach is tit-for-tat: it uploads to the peers that are uploading to it, and every so often picks one peer at random to try (optimistic unchoking) in case they turn out to be faster. Peers that give nothing back get less.',
      },
      {
        type: 'p',
        text: 'Clients also prefer to request the pieces that are rarest in the swarm. That keeps a piece from disappearing when its only holder leaves, which is the usual way a swarm dies while still showing plenty of peers.',
      },
      {
        type: 'note',
        title: 'Your IP address is visible',
        text: 'Every peer you exchange data with sees your IP address; that’s how the pieces get delivered. Trackers see it when you announce, and anyone can query the DHT. [Privacy basics for torrenting](/articles/privacy-basics-for-torrenting) covers what that does and doesn’t mean in practice.',
      },
      { type: 'h2', text: 'Seeding' },
      {
        type: 'p',
        text: 'Once every piece is verified, the download is complete. If you leave the torrent running you’re a seeder: a peer with the full file that only uploads. New downloaders depend on seeders, especially early on when few peers have the whole thing. Nothing in the protocol forces you to seed, but a torrent with zero seeders can’t be completed by anyone, and [Seeders, leechers, and swarm health](/articles/seeders-leechers-and-ratio) explains how to read that from the numbers on a listing.',
      },
    ],
  },
  {
    slug: 'magnet-links-vs-torrent-files',
    title: 'Magnet links vs .torrent files',
    navLabel: 'Magnet vs torrent files',
    description: 'Two ways of describing the same download, what’s inside each, and when the difference matters.',
    category: 'Protocol',
    cover: { label: 'Magnets vs .torrent Files', palette: 'copper' },
    publishedAt: '2026-09-14',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'A magnet link and a `.torrent` file both point a client at the same thing: a swarm identified by an info hash. The difference is how much the client knows before it connects. A torrent file has everything up front. A magnet has the hash and a couple of hints, and the client asks other peers for the rest.',
      },
      { type: 'h2', text: 'What’s in a .torrent file' },
      {
        type: 'p',
        text: 'It’s a small binary file in a format called bencoding. The important part is the `info` dictionary: the name, the piece length, the piece hashes joined together, and the file list with sizes. Everything outside `info` is optional: tracker URLs, a creation date, a comment, the name of the tool that made it. The info hash is the SHA-1 of the `info` dictionary, which is why two torrent files with different trackers but identical content end up with the same hash and join the same swarm.',
      },
      {
        type: 'p',
        text: 'Because the file list is included, a client can show you exactly what you’re about to download, and let you deselect files, before it makes a single connection.',
      },
      { type: 'h2', text: 'What’s in a magnet' },
      {
        type: 'p',
        text: 'A magnet is a URI. A typical one looks like `magnet:?xt=urn:btih:<hash>&dn=<name>&tr=<tracker>`. The `xt` parameter carries the info hash, `dn` a display name, and `tr` a tracker, repeated once per tracker. Only `xt` is required.',
      },
      {
        type: 'p',
        text: 'On its own the hash isn’t enough to download anything. The client finds peers through DHT or the listed trackers, then asks one of them for the metadata using the extension described in BEP 9. Once it has that, it’s in exactly the same position as if it had opened a torrent file. That fetch is the “Downloading metadata” step you see in clients, and it will sit there indefinitely if the swarm is empty.',
      },
      { type: 'h2', text: 'Which to use' },
      {
        type: 'ul',
        items: [
          'Magnets are easier to share and don’t need hosting, which is why most indexers moved to them.',
          'A torrent file is better when you want to see the file list first, or when DHT is blocked on your network and the torrent’s trackers are the only way in.',
          'They aren’t exclusive. If you have both for the same hash, either works, and most clients will offer to merge the tracker lists if you add the second one.',
        ],
      },
      {
        type: 'note',
        title: 'Matching by hash',
        text: 'Titles on indexers are free text. Two listings with the same title can be different torrents, and one torrent can be listed under several titles. If you need to know whether two listings are the same thing, compare the `btih` value in the magnet.',
      },
      { type: 'h2', text: 'What torseek shows' },
      {
        type: 'p',
        text: 'Each result exposes a magnet when the indexer provides one. Some indexers only offer a `.torrent` download that goes through Jackett, and those URLs carry Jackett’s API key, so torseek drops them instead of passing them to the browser. The info hash is usually still available, and the Download button uses it to open the torrent in webtor.io.',
      },
    ],
  },
  {
    slug: 'seeders-leechers-and-ratio',
    title: 'Seeders, leechers, and swarm health',
    navLabel: 'Seeders and leechers',
    description: 'What the numbers next to a torrent mean, how much to trust them, and why seeding matters.',
    category: 'Guide',
    cover: { label: 'Swarm Health', palette: 'moss' },
    publishedAt: '2026-09-12',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'Two numbers sit next to nearly every torrent listing. Seeders are peers who have the complete file and are still connected. Leechers are peers who are still downloading. Between them they tell you whether a torrent is likely to finish, and roughly how quickly, before you commit to it.',
      },
      { type: 'h2', text: 'Reading the counts' },
      {
        type: 'ul',
        items: [
          '**0 seeders.** Nobody in the swarm has the full file right now. It may still complete if the leechers between them hold every piece, but that’s luck. Old torrents often sit here for good.',
          '**1 to 5 seeders.** Downloadable, usually slowly, and it can go dead if those few people leave. Reasonable when nothing better exists.',
          '**Dozens or more.** A healthy swarm. Your download speed is now more about your connection than the torrent.',
        ],
      },
      {
        type: 'p',
        text: 'torseek shows seeders and peers as the indexer reported them. For most Jackett indexers the peers figure is the total (seeders plus leechers), so the number of leechers is the gap between the two.',
      },
      {
        type: 'p',
        text: 'These are snapshots. Indexers scrape trackers on their own schedule, some don’t scrape at all and copy numbers from elsewhere, and swarms change by the minute. A big gap between indexers for the same title usually means they’re listing different torrents, not that one indexer is more accurate. The count your client shows after connecting is the only current one.',
      },
      { type: 'h2', text: 'Ratio' },
      {
        type: 'p',
        text: 'Ratio is uploaded bytes divided by downloaded bytes. Download 4 GiB and upload 2 GiB and your ratio is 0.5; upload 4 GiB and it’s 1.0. Clients show it per torrent and overall.',
      },
      {
        type: 'p',
        text: 'On public torrents nobody enforces it. Private trackers do, because their model is that members keep swarms alive for each other, and an account that only downloads gets warned and then banned. The rules vary: some want your overall ratio above a threshold, some want a minimum seed time on each torrent, some accept either.',
      },
      {
        type: 'p',
        text: 'Even without rules, ratio is a fair measure of whether you’re a net cost to the swarm. You don’t need to chase 1.0 on everything. Leaving finished torrents running while you’re at the computer anyway is usually enough to get there on popular ones.',
      },
      { type: 'h2', text: 'Why swarms die' },
      {
        type: 'p',
        text: 'A swarm needs every piece to exist somewhere among its members. Popular torrents stay alive because a steady trickle of new downloaders become seeders. Niche ones survive exactly as long as the last person with the file keeps seeding. When they stop, the listing shows leechers for a while, then nobody. Nothing brings it back except someone with the complete file returning.',
      },
      {
        type: 'note',
        title: 'You upload before you finish',
        text: 'Leechers upload the pieces they already have. Seeing upload traffic at 30% complete is normal; it’s how the protocol is supposed to work.',
      },
    ],
  },
  {
    slug: 'spotting-fake-torrents',
    title: 'Spotting fake torrents',
    navLabel: 'Spotting fake torrents',
    description: 'Bad listings aren’t rare on public indexers. What to look at before, and right after, you add one.',
    category: 'Safety',
    cover: { label: 'Spotting Fakes', palette: 'rose' },
    publishedAt: '2026-09-10',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'Public indexers accept uploads from anyone, and some of what gets uploaded is deliberately wrong: a title that matches what people search for, and a payload that’s an installer for something else. BitTorrent doesn’t help you here. Piece hashes guarantee you receive exactly the file the uploader hashed. They say nothing about whether that file is what the title claims.',
      },
      { type: 'h2', text: 'On the results page' },
      {
        type: 'ul',
        items: [
          '**Size.** You usually know roughly what to expect. A feature film under 200 MiB, a Linux ISO of 30 MiB, or a 20 GiB “PDF” is wrong before you look any further.',
          '**Age and seeders together.** A listing uploaded an hour ago with hundreds of seeders is either a very popular release that other indexers also show, or the count is faked. Check for the same title elsewhere.',
          '**Title stuffing.** Real release names follow conventions. A title that lists five formats and three languages, or ends in “WORKING 2026”, isn’t following any of them.',
          '**Uploader.** On indexers that show uploader names, an account with a history is worth more than a fresh one. Impersonation happens too, so a familiar-looking name with one letter changed is a bad sign rather than a good one.',
        ],
      },
      { type: 'h2', text: 'In the client' },
      {
        type: 'p',
        text: 'The file list is the best check you have. Most clients show it before the download starts, or you can pause immediately after adding. Look for:',
      },
      {
        type: 'ul',
        items: [
          'An `.exe`, `.msi`, `.scr`, `.bat`, `.js`, or `.lnk` sitting next to a video, a book, or an ISO.',
          'A single tiny file where a large one should be, especially a compressed archive with a text file telling you to fetch a password from a website.',
          'Archives inside archives. There’s no honest reason to zip a rar.',
          'An `.iso` of a few megabytes. ISOs are the size of what they contain.',
        ],
      },
      {
        type: 'p',
        text: 'If the list is wrong, remove the torrent and delete the data. Nothing has run yet; a bad file on disk is harmless until it’s opened.',
      },
      {
        type: 'note',
        title: 'Comments and ratings',
        text: 'Some indexers have comment threads on listings. Where they exist they’re the fastest way to find out a file is fake, because someone else already downloaded it. torseek doesn’t pull comments through, so click through to the indexer if a listing looks off.',
      },
      { type: 'h2', text: 'Verifying the ones that matter' },
      {
        type: 'p',
        text: 'For software and OS images, the publisher’s own site will list a checksum, usually SHA-256, or the info hash of their official torrent. Compare against that, not against another listing. If the project doesn’t publish one and the file is an installer, you’re trusting a stranger’s upload with administrator rights on your machine. Most of the time that isn’t a trade worth making.',
      },
    ],
  },
  {
    slug: 'legal-torrents',
    title: 'Legal torrents and open content',
    navLabel: 'Legal torrents',
    description: 'Plenty of large files are meant to be shared over BitTorrent. Where to find them and how to check.',
    category: 'Legal',
    cover: { label: 'Legal Torrents', palette: 'slate' },
    publishedAt: '2026-09-08',
    featured: true,
    body: [
      {
        type: 'p',
        text: 'BitTorrent is a way of moving large files, and a lot of organisations use it because it’s cheap at scale: every downloader helps distribute. Linux distributions, archives, and open-licence media projects publish torrents on their own websites. They’re worth knowing about because they’re useful, and because they’re the clearest examples of the protocol doing what it was built for.',
      },
      {
        type: 'note',
        title: 'The usual caveat',
        text: 'Whether a torrent is legal depends on what’s in it and whether you have permission. A search engine can’t tell you that, and neither can a seeder count. If you aren’t sure you’re allowed to copy something, assume you aren’t.',
      },
      { type: 'h2', text: 'Operating systems' },
      {
        type: 'p',
        text: 'Nearly every major distribution offers torrents alongside its HTTP mirrors: Ubuntu, Debian, Fedora, Arch, Linux Mint, openSUSE, and plenty of smaller ones. The download page is where to get the magnet or `.torrent`, along with the SHA-256 or GPG signature for the image. Install media is exactly where a fake would hurt most, so the checksum step isn’t optional.',
      },
      {
        type: 'p',
        text: 'These swarms tend to be enormous. A new Ubuntu release can have thousands of seeders in the week after it ships, which makes it a good way to test a new client or a port-forwarding setup.',
      },
      { type: 'h2', text: 'Films, music, and books' },
      {
        type: 'p',
        text: 'Projects that release under Creative Commons or into the public domain often seed their own work. The Blender Foundation’s open movies were distributed this way. The Internet Archive generates a torrent for most items in its collection, so out-of-copyright films, old radio, and scanned books are all available over BitTorrent with the Archive itself as a permanent seed. Smaller labels and independent musicians sometimes do the same.',
      },
      {
        type: 'p',
        text: 'The licence is on the project’s page, not in the torrent. A CC-licensed film seeded by its makers is fine. The same film re-encoded and uploaded by a stranger may also be fine, but now you’re trusting the stranger.',
      },
      { type: 'h2', text: 'Data' },
      {
        type: 'ul',
        items: [
          'Wikimedia database dumps, some of which volunteers mirror as torrents and link from the dumps site.',
          'Research datasets too large for one institution to serve comfortably. Academic Torrents exists for exactly this.',
          'Open-source games and game assets where the developers host a torrent to take load off their own servers.',
        ],
      },
      { type: 'h2', text: 'Using them on torseek' },
      {
        type: 'p',
        text: 'Public indexers list plenty of this material, sometimes in copies that are older, repacked, or mislabelled. When a project publishes an official torrent, use theirs. If you find the same title on an indexer, compare the info hash with the official one before trusting it. [Magnet links vs .torrent files](/articles/magnet-links-vs-torrent-files) shows where the hash lives.',
      },
    ],
  },
  {
    slug: 'what-is-an-indexer',
    title: 'What is a torrent indexer?',
    navLabel: 'What is an indexer',
    description: 'Indexers publish listings, not files. How that works, and how torseek reaches them through Jackett.',
    category: 'Guide',
    cover: { label: 'What Is an Indexer', palette: 'sand' },
    publishedAt: '2026-09-06',
    body: [
      {
        type: 'p',
        text: 'An indexer is a website that catalogues torrents. It stores titles, sizes, magnet links or `.torrent` files, categories, and often seeder counts and uploader names. It doesn’t store the content. When you “download from” an indexer, what you get is a few hundred bytes of metadata; the actual file comes from other people’s computers.',
      },
      { type: 'h2', text: 'Public and private' },
      {
        type: 'p',
        text: 'Public indexers let anyone search and, on most of them, anyone upload. They cover a lot of ground, duplicate each other heavily, and carry a fair amount of junk. Private trackers require an account, usually by invitation, and enforce upload rules. Their listings tend to be better curated and their swarms healthier, and they’re closed to outside search on purpose. torseek only reaches what Jackett is configured for; it isn’t a way into private sites you don’t already belong to.',
      },
      { type: 'h2', text: 'Where Jackett fits' },
      {
        type: 'p',
        text: 'Every indexer has its own page layout and, if it has one at all, its own API. [Jackett](https://github.com/Jackett/Jackett) is a self-hosted service that knows how to talk to a few hundred of them and exposes one standard interface, Torznab, on the other side. You add indexers in Jackett’s admin page; anything that queries Jackett then gets results from all of them in a single format.',
      },
      {
        type: 'p',
        text: 'torseek’s backend sends your query to Jackett, which fans it out to each configured indexer, waits for the responses, and returns one combined feed. torseek normalises those, drops anything that would leak Jackett’s own URLs, then sorts and pages. The indexer list in the search filters is read from Jackett, so it reflects whatever the operator has set up.',
      },
      {
        type: 'note',
        title: 'When an indexer is down',
        text: 'Indexers go offline, change their layout, or start blocking automated access. Jackett reports those failures per indexer, and torseek shows a status line under the results when some of them didn’t respond. A search that returns less than usual is often one big indexer having a bad day rather than a genuine lack of results.',
      },
      { type: 'h2', text: 'What this means when searching' },
      {
        type: 'ul',
        items: [
          'The same torrent can appear several times, once per indexer. Same info hash, same swarm.',
          'Seeder counts differ between indexers because each scrapes on its own schedule. See [Seeders, leechers, and swarm health](/articles/seeders-leechers-and-ratio).',
          'The indexer name on a result tells you where the listing came from, which matters when deciding whether to trust it. It tells you nothing about who is seeding.',
        ],
      },
    ],
  },
  {
    slug: 'choosing-a-torrent-client',
    title: 'Choosing a torrent client',
    navLabel: 'Choosing a client',
    description: 'The protocol is the same in every client. What actually differs, and which settings are worth touching.',
    category: 'Guide',
    cover: { label: 'Choosing a Client', palette: 'graphite' },
    publishedAt: '2026-09-04',
    body: [
      {
        type: 'p',
        text: 'A torrent client does the work: it reads the magnet or `.torrent`, finds peers, downloads and verifies pieces, writes the files, and seeds afterwards. Any competent client will handle any torrent. What differs is the interface, the defaults, what it runs on, and whether the installer is trying to sell you something.',
      },
      { type: 'h2', text: 'Reasonable choices' },
      {
        type: 'ul',
        items: [
          '**qBittorrent.** Open source, cross-platform, no adverts. Sequential download, RSS, a web UI for remote control, per-torrent speed limits. The usual default recommendation.',
          '**Transmission.** Lightweight, with a native macOS app and a daemon that’s common on Linux servers and NAS boxes. Fewer options, which is a feature if you don’t want to configure anything.',
          '**Deluge.** Runs as a daemon with separate GTK, web, or console front ends. Useful when the client lives on a different machine from the one you’re sitting at.',
        ],
      },
      {
        type: 'p',
        text: 'Download from the project’s own site. A few once-popular clients now ship bundled software or ads, and there are lookalike download sites that wrap legitimate installers in something else.',
      },
      { type: 'h2', text: 'Settings worth changing' },
      {
        type: 'ol',
        items: [
          '**Download location.** Point it at a drive with room. Running out of disk mid-download is recoverable, but annoying.',
          '**Listening port.** Clients pick a random one. If your router supports it, forward that port, or enable UPnP/NAT-PMP in the client so it can ask the router itself. Being reachable means peers can connect to you rather than only the other way round, which noticeably helps on small swarms.',
          '**Upload limit.** Unlimited upload on a home connection can saturate the link and make everything else on the network sluggish. Setting it to around 80% of your measured upload speed keeps things usable.',
          '**Encryption.** Most clients default to “prefer encrypted”. Leave it. It doesn’t hide that you’re torrenting, but it does get past some traffic shaping.',
          '**Seeding limits.** Set a stopping rule you’re comfortable with, a ratio or a seed time, so finished torrents don’t run forever by accident. Don’t set it to stop the moment they finish, either.',
        ],
      },
      {
        type: 'note',
        title: 'Sequential download',
        text: 'Downloading pieces in order lets a video start playing before it’s complete. It also means you aren’t fetching the rarest pieces first, which is slightly worse for the swarm. Fine to use when you want it; not a good permanent default.',
      },
      { type: 'h2', text: 'A first test' },
      {
        type: 'p',
        text: 'Grab an official Linux ISO torrent, let it finish, and check the SHA-256 against the distribution’s download page. If that works, the client, your firewall, and your port setup are all fine, and you’ve seen what a healthy swarm looks like before you meet an unhealthy one.',
      },
    ],
  },
  {
    slug: 'privacy-basics-for-torrenting',
    title: 'Privacy basics for torrenting',
    navLabel: 'Privacy basics',
    description: 'What the swarm can see about you, what it can’t, and which precautions are actually worth taking.',
    category: 'Safety',
    cover: { label: 'Privacy Basics', palette: 'slate' },
    publishedAt: '2026-09-02',
    body: [
      {
        type: 'p',
        text: 'BitTorrent works by connecting your computer directly to other people’s. To do that, they need your IP address and you need theirs. There’s no version of the protocol where that isn’t true. Most privacy advice around torrenting is really about deciding who gets to see that address, not about hiding it from the swarm altogether.',
      },
      { type: 'h2', text: 'What’s visible' },
      {
        type: 'ul',
        items: [
          'Your IP address and the port your client listens on, to every peer you exchange data with.',
          'Which info hash you’re in the swarm for, to those peers, to any tracker you announce to, and to anyone who queries the DHT for that hash.',
          'Roughly how much of the file you have, since clients tell each other which pieces they hold.',
        ],
      },
      {
        type: 'p',
        text: 'What isn’t visible is anything about the rest of your client, other torrents you have running, or the contents of your disk. The data itself is usually encrypted between peers, though that only matters to someone sitting in the middle, not to the peers themselves.',
      },
      { type: 'h2', text: 'Who’s looking' },
      {
        type: 'p',
        text: 'Anyone can join a swarm and record the addresses they see. Rights holders, and companies working for them, do this systematically for copyrighted material and then send notices to the ISP the address belongs to. Researchers and hobbyists do it for other reasons. For a Linux ISO or an Internet Archive film, none of this matters. For anything you aren’t allowed to distribute, your IP address in the swarm is the paper trail. See [Legal torrents](/articles/legal-torrents).',
      },
      { type: 'h2', text: 'Sensible precautions' },
      {
        type: 'ol',
        items: [
          'Don’t torrent on a network you’re answerable to someone else for: an employer’s, a university’s, a shared flat where the account is in someone else’s name.',
          'If you use a VPN, pick one with a kill switch so the client doesn’t fall back to your real address when the tunnel drops, and bind the client to the VPN’s network interface if it supports that (qBittorrent does, under Advanced). Then confirm what address the swarm sees, for instance with a tracker that echoes your IP back.',
          'Keep your client’s web UI, if you turn it on, bound to localhost or behind authentication. An exposed web UI is a far bigger exposure than any swarm.',
          'Worry more about what you run than about who sees you. A malicious payload does more damage than an IP in a log. [Spotting fake torrents](/articles/spotting-fake-torrents) is the more useful article for most people.',
        ],
      },
      {
        type: 'note',
        title: 'About the private flag',
        text: 'Torrents from private trackers set a flag (BEP 27) that turns off DHT and PEX so peers come only from the tracker. It exists to enforce the tracker’s rules, and it does keep you out of the public DHT for that torrent. It doesn’t hide your address from the other members of the swarm.',
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
