import { Button, Navbar, Menu, PanelStack2 } from '@blueprintjs/core'
import { Popover2, MenuItem2 } from '@blueprintjs/popover2'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Home from './home'
import Settings from './settings'
import Overlay from './overlay'

console.log('[root.tsx]', `Hello world from Electron ${process.versions.electron}!`)

const MNavbarGroup = motion(Navbar.Group)

function Root() {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    console.log('[root.tsx]', 'location changed:', location.pathname)
  }, [location])

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      <Navbar fixedToTop>
        <Navbar.Group style={{ display: location.pathname === '/' ? 'none' : 'flex', marginRight: 12, transition: 'display 200ms' }}>
          <Button minimal icon="arrow-left" onClick={() => navigate('/')} />
        </Navbar.Group>
        <Navbar.Group>
          <Navbar.Heading style={{ userSelect: 'none' }}>Overloaded</Navbar.Heading>
          <Navbar.Divider />
        </Navbar.Group>
        <Navbar.Group align="right">
          <Button icon="cog" onClick={() => navigate('/settings')} />
          {/* <Popover2 content={<MoreMenu />} placement="bottom">
            <Button icon="more" style={{}}></Button>
          </Popover2> */}
        </Navbar.Group>
      </Navbar>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname} location={location}>
          <Route path="/" element={<Home />} />
          <Route path="settings" element={<Settings />} />
          <Route path="/overlay/:overlay" element={<Overlay />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

function MoreMenu() {
  const navigate = useNavigate()
  return (
    <Menu>
      <MenuItem2 text="Settings" icon="cog" onClick={() => navigate('/settings')} />
    </Menu>
  )
}

export default Root
export async function rootLoader() {}
