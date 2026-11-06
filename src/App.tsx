import { useEffect, useRef } from 'react'
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { PrintOverlay } from './components/PrintOverlay'
import { About } from './pages/About'
import { Classroom } from './pages/Classroom'
import { Clues } from './pages/Clues'
import { Compare } from './pages/Compare'
import { Cover } from './pages/Cover'
import { Create } from './pages/Create'
import { Dossier } from './pages/Dossier'
import { Ending } from './pages/Ending'
import { Game } from './pages/Game'
import { Help } from './pages/Help'
import { Home } from './pages/Home'
import { Replay } from './pages/Replay'
import { Roles } from './pages/Roles'
import { ScriptDraft } from './pages/ScriptDraft'
import { Seats } from './pages/Seats'
import { Setup } from './pages/Setup'
import { Stories } from './pages/Stories'
import { Studio } from './pages/Studio'
import { Summary } from './pages/Summary'
import { Teacher } from './pages/Teacher'
import { VoiceLab } from './pages/VoiceLab'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function EntryGuard() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const gameplay = /^\/(game|classroom|roles|setup|ending|replay|compare|summary)(\/|$)/.test(pathname)
    if (!gameplay) {
      try {
        sessionStorage.setItem('echo-archive-entered', '1')
      } catch {
        // sessionStorage can be blocked; the cover page is still the entry route
      }
      return
    }
    let entered = false
    try {
      entered = sessionStorage.getItem('echo-archive-entered') === '1'
    } catch {
      entered = false
    }
    if (!entered) navigate('/', { replace: true })
  }, [navigate, pathname])

  return null
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <EntryGuard />
      <Routes>
        <Route path="/" element={<Cover />} />
        <Route path="/menu" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/draft/:storyId" element={<ScriptDraft />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/seats" element={<Seats />} />
        <Route path="/seats/:storyId" element={<Seats />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/setup/:storyId" element={<Setup />} />
        <Route path="/roles/:storyId" element={<Roles />} />
        <Route path="/roles/:storyId/:charId" element={<Dossier />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/clues" element={<Clues />} />
        <Route path="/ending" element={<Ending />} />
        <Route path="/replay" element={<Replay />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        {import.meta.env.DEV ? <Route path="/voice-lab" element={<VoiceLab />} /> : null}
        <Route path="*" element={<Cover />} />
      </Routes>
      <PrintOverlay />
    </HashRouter>
  )
}
