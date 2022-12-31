import React from 'react'
import { motion } from 'framer-motion'
type Props = {}

export default function Settings({}: Props) {
  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.5 }}>
      Settings
    </motion.div>
  )
}
