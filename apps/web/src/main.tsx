import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ThemeProvider } from 'next-themes'
import { PostHogProvider } from '@posthog/react'

import { TooltipProvider } from '@/components/ui/tooltip'
import App from './App.tsx'
import './index.css'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-05-30'
} as const

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <PostHogProvider
          apiKey={import.meta.env.VITE_POSTHOG_PROJECT_TOKEN}
          options={options}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PostHogProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
