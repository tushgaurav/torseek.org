import { useEffect } from 'react'

import background from '@/assets/bg.jpg'
import Doodle from '@/components/home/doodle'
import { SearchBar } from '@/components/search/search-bar'
import { Page } from '@/components/shared/page'
import { siteContent } from '@/content/content'

export default function Home() {
  useEffect(() => {
    document.title = `${siteContent.structuredData.name} - ${siteContent.metadata.description}`
  }, [])

  return (
    <div className="relative flex flex-col flex-grow w-full overflow-hidden">
      <img
        src={background}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-50 -z-10 pointer-events-none select-none"
      />
      <Page className="flex flex-col items-center justify-center flex-grow w-full">
        <Doodle />
        <SearchBar withSubmitButton className="mx-auto" />
      </Page>
    </div>
  )
}
