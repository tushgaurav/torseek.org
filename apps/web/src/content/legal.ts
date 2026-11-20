import type { ArticleBlock } from '@/content/articles'

export type LegalDocument = {
  title: string
  description: string
  updatedAt: string
  body: ArticleBlock[]
}

export const privacyPolicy: LegalDocument = {
  title: 'Privacy Policy',
  description: 'What torseek collects when you search, where it goes, and what you can do about it.',
  updatedAt: '2026-11-20',
  body: [
    {
      type: 'p',
      text: 'torseek is a search interface for public torrent indexers. It has no accounts, shows no ads, and doesn’t sell or share anything for advertising. This page lists what does get collected when you use it, where it goes, and how long it stays.',
    },
    { type: 'h2', text: 'What happens when you search' },
    {
      type: 'p',
      text: 'Your query goes to the torseek API, which hands it to Jackett, and Jackett asks each configured indexer. Those requests come from our server, so the indexers see the server’s address, not yours. The same goes for The Movie Database (TMDB): the API looks the title up and fetches the poster itself, then serves the image to you, so your browser never talks to TMDB directly.',
    },
    {
      type: 'p',
      text: 'The merged results are kept in the API’s memory for up to 10 minutes so that paging and re-sorting don’t repeat the search. That cache is never written to disk and is cleared whenever the server restarts.',
    },
    { type: 'h2', text: 'Analytics' },
    {
      type: 'p',
      text: 'We use PostHog, hosted in the EU, to see how search is used and where it breaks. Automatic click tracking and session recording are both turned off. The events we send are:',
    },
    {
      type: 'ul',
      items: [
        '**Searches**: the query text, the category, sort order and indexers selected, how many results came back, how long it took, and whether it failed.',
        '**Title panel**: whether a TMDB match was found for the query, which title it was, and whether you dismissed it or followed one of its links.',
        '**Result actions**: when you open a result, copy a magnet link, open a download, or visit a listing on its indexer, along with the indexer’s name and the seeder and peer counts.',
        '**Page views and errors**: which pages are visited, and any errors the site or API runs into.',
      ],
    },
    {
      type: 'p',
      text: 'PostHog stores a random identifier in your browser (a cookie and a local storage entry) so that events from one visit can be grouped together. It isn’t linked to a name or email address, because we never ask for either. Like any web request, PostHog also sees your IP address, which it uses to estimate a rough location such as your country. We use this data only to improve torseek and don’t combine it with data from anywhere else.',
    },
    {
      type: 'p',
      text: 'If you block PostHog with a content blocker, torseek works exactly the same.',
    },
    { type: 'h2', text: 'Server logs' },
    {
      type: 'p',
      text: 'When a search fails, the API logs the query and the error so we can fix the cause. The infrastructure providers that serve the website and the API may also keep standard request logs, including IP addresses, for security and operations.',
    },
    { type: 'h2', text: 'Stored in your browser' },
    {
      type: 'ul',
      items: [
        'Your light or dark theme choice, in local storage.',
        'PostHog’s anonymous identifier, described above.',
      ],
    },
    {
      type: 'p',
      text: 'There are no advertising or cross-site tracking cookies.',
    },
    { type: 'h2', text: 'Leaving torseek' },
    {
      type: 'p',
      text: 'Clicking a result hands you off to something else, and torseek can’t see or control what happens after that. A magnet link opens in your own torrent client, which joins a public swarm where every other peer can see your IP address. [Privacy basics for torrenting](/articles/privacy-basics-for-torrenting) covers what that means in practice. **Download** opens the torrent on webtor.io, and **Open on** takes you to the indexer’s own page. Each of those has its own privacy policy.',
    },
    { type: 'h2', text: 'Your choices' },
    {
      type: 'ul',
      items: [
        'Block analytics with a content blocker, or clear this site’s data to reset the identifier. Search keeps working either way.',
        'Ask us to delete your analytics data. Because events are anonymous, include the `distinct_id` from the `ph_…_posthog` entry in your browser’s storage so we can find them.',
        'Ask what we hold about you, or anything else about this policy, through the [contact page](/contact).',
      ],
    },
    { type: 'h2', text: 'Changes to this policy' },
    {
      type: 'p',
      text: 'If what we collect changes, this page changes with it and the date at the top moves.',
    },
  ],
}

export const termsOfService: LegalDocument = {
  title: 'Terms of Service',
  description: 'The rules for using torseek, and what it does and doesn’t promise.',
  updatedAt: '2026-11-20',
  body: [
    {
      type: 'p',
      text: 'These terms cover your use of torseek.org and its API. By using the site you agree to them. If you don’t, please don’t use it.',
    },
    { type: 'h2', text: 'What torseek is' },
    {
      type: 'p',
      text: 'torseek is a search engine. It sends your query to third-party torrent indexers through Jackett and shows what they return. It doesn’t host, upload, seed, or store any of the files, torrents, or magnet links it lists, and it doesn’t keep an index of its own. Every result comes live from a site we don’t run.',
    },
    {
      type: 'p',
      text: 'That means we don’t decide what appears in results, and we can’t vouch for any of it. A listing showing up on torseek isn’t an endorsement, and it isn’t a statement that downloading it is legal.',
    },
    { type: 'h2', text: 'Your responsibilities' },
    {
      type: 'p',
      text: 'You’re responsible for what you download and share, and for following the laws where you live, copyright law included. In particular, you agree not to:',
    },
    {
      type: 'ul',
      items: [
        'use torseek to download or distribute material you don’t have the right to copy;',
        'send automated queries at a volume that degrades the service for others, or scrape the API to power another service;',
        'try to break, overload, or get around the security of the site or the servers behind it;',
        'use torseek for anything unlawful.',
      ],
    },
    {
      type: 'note',
      title: 'Is this legal?',
      text: 'Searching isn’t the problem; copying can be. Whether a particular torrent is legal depends on what’s in it and whether you have permission, and only you can check that. [Legal torrents and open content](/articles/legal-torrents) lists places that publish torrents openly.',
    },
    { type: 'h2', text: 'Results come with no guarantees' },
    {
      type: 'p',
      text: 'Indexers carry fake, mislabelled, and malicious uploads, and seeder counts, sizes, and dates are whatever the indexer last reported. Check what you open, scan what you download, and verify checksums where they’re published. [Spotting fake torrents](/articles/spotting-fake-torrents) is a good place to start.',
    },
    {
      type: 'p',
      text: 'The title panel shows data from The Movie Database (TMDB). torseek uses the TMDB API but is not endorsed or certified by TMDB.',
    },
    { type: 'h2', text: 'Third-party sites' },
    {
      type: 'p',
      text: 'Results link out to indexers, magnet links open in your own torrent client, and the Download button opens webtor.io. Those are run by other people under their own terms. We aren’t responsible for their content, their availability, or what they do with your data.',
    },
    { type: 'h2', text: 'Copyright complaints' },
    {
      type: 'p',
      text: 'Because torseek stores nothing, the effective way to get a listing removed is to contact the indexer that publishes it. Each result names its source and links to the listing’s page. Once the indexer takes a listing down, it stops appearing in torseek searches within minutes.',
    },
    {
      type: 'p',
      text: 'If you still need to reach us, write through the [contact page](/contact) with the work you own and the URLs or info hashes involved.',
    },
    { type: 'h2', text: 'Availability' },
    {
      type: 'p',
      text: 'torseek is free and provided as is. Indexers go down, Jackett times out, and we may change, limit, or shut down any part of the service at any time without notice. We may also block access for anyone who breaks these terms.',
    },
    { type: 'h2', text: 'Disclaimer and liability' },
    {
      type: 'p',
      text: 'To the extent the law allows, torseek comes without warranties of any kind, express or implied, including fitness for a particular purpose and non-infringement. We aren’t liable for any loss or damage arising from your use of the site, from the results it shows, or from anything you download through them.',
    },
    { type: 'h2', text: 'Changes to these terms' },
    {
      type: 'p',
      text: 'We may update these terms, and the date at the top shows when they last changed. Using torseek after a change means you accept the new version.',
    },
  ],
}
