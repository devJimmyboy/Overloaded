import React from 'react'
import { motion } from 'framer-motion'
import { Button, Text } from '@blueprintjs/core'
import type { UpdateInfo } from 'electron-updater'
type Props = {}

export default function Settings({}: Props) {
  const [version, setVersion] = React.useState<string>('')
  const [latestVersion, setLatestVersion] = React.useState<UpdateInfo>()
  const [loading, setLoading] = React.useState<boolean>(false)
  React.useEffect(() => {
    ipc.invoke('get-version').then((res) => {
      setVersion(res)
    })
  }, [])

  const checkForUpdates = () => {
    console.log('checking for updates')
    setLoading(true)
    ipc.invoke('manual-update').then((res: UpdateInfo) => {
      console.log('update:', res)
      setLatestVersion(res)
      setLoading(false)
    })
  }
  return (
    <motion.div className="p-2" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.5 }}>
      <Text className="text-center text-lg font-semibold">Settings</Text>
      <div className="flex flex-row gap-2 items-center justify-center">
        <Text className="text-center text-lg font-semibold">Version: {version}</Text>
        {latestVersion ? (
          <></>
        ) : (
          <Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={checkForUpdates} loading={loading}>
            Check for updates
          </Button>
        )}
        {!!latestVersion &&
          (latestVersion?.version === version ? (
            <Text>You have the latest version!</Text>
          ) : (
            <Button
              icon="updated"
              onClick={() => {
                ipc.invoke('update-now')
              }}>
              Update now
            </Button>
          ))}
      </div>
    </motion.div>
  )
}
