import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ThemeProvider } from 'next-themes'
import posthog from 'posthog-js'
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'

import { TooltipProvider } from '@/components/ui/tooltip'
import App from './App.tsx'
import './index.css'

const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const host = import.meta.env.VITE_POSTHOG_HOST

if (token) {
  posthog.init(token, {
    api_host: host,
    defaults: '2026-05-30',
    autocapture: false,
    disable_session_recording: true,
    person_profiles: 'identified_only',
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <PostHogProvider client={posthog}>
          <PostHogErrorBoundary>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </PostHogErrorBoundary>
        </PostHogProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
