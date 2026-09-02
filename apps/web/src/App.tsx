import { Route, Routes } from 'react-router'

import { AppLayout } from '@/layouts/app-layout'
import Home from '@/pages/home'
import NotFound from '@/pages/not-found'
import SearchResults from '@/pages/search'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
