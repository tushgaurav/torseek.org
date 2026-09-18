import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from '@/layouts/app-layout'
import Article from '@/pages/article'
import Articles from '@/pages/articles'
import Home from '@/pages/home'
import NotFound from '@/pages/not-found'
import SearchResults from '@/pages/search'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="articles" element={<Articles />} />
        <Route path="articles/:slug" element={<Article />} />
        <Route path="docs" element={<Navigate to="/articles" replace />} />
        <Route path="docs/*" element={<Navigate to="/articles" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
