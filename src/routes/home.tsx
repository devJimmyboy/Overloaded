import { Button, ButtonGroup, Card, Checkbox, Dialog, Divider, InputGroup, Label, NumericInput, Text } from '@blueprintjs/core'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { IOverlay } from '../types'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [windows, setWindows] = useState<IOverlay[]>([])
  const getOverlays = useCallback(() => {
    ipc.invoke('get-overlays').then((windows: IOverlay[]) => {
      setWindows(windows)
    })
  }, [setWindows])
  useEffect(() => {
    getOverlays()
  }, [])
  return (
    <motion.div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {windows.length > 0 ? (
        windows.map((win: IOverlay) => {
          return (
            <Card key={win.name} interactive onClick={() => navigate(`/overlay/${win.name.toLowerCase()}`)} style={{ display: 'flex', width: '100%', height: '5rem', alignItems: 'center' }}>
              <Text style={{ fontWeight: 600, fontSize: '20px' }}>{win.name}</Text>
              <div style={{ flexGrow: 1 }} />
              <ButtonGroup large>
                <Button
                  icon={win.show ? 'eye-on' : 'eye-off'}
                  onClick={(e) => {
                    e.stopPropagation()
                    ipc.invoke('toggle-overlay', win.name).then(() => {
                      getOverlays()
                    })
                  }}
                />
                <Button
                  icon="edit"
                  onClick={(e) => {
                    e.stopPropagation()
                    ipc.invoke('move-overlay', win.name)
                  }}
                />
              </ButtonGroup>
            </Card>
          )
        })
      ) : (
        <Card>No windows</Card>
      )}
      <div style={{ flexGrow: 1 }} />
      <Card style={{ width: '100%', height: '4rem' }}>
        <ButtonWithDialog
          onClose={() => {
            getOverlays()
          }}
        />
      </Card>
    </motion.div>
  )
}

function ButtonWithDialog({ onClose }: { onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const form = useFormik<IOverlay>({
    initialValues: {
      name: '',
      url: '',
      alwaysOnTop: false,
      frame: false,
      transparent: false,
      resizable: false,
      show: true,
      height: 400,
      width: 600,
      webPreferences: {},
    },
    onSubmit: (values) => {
      ipc.invoke('new-overlay', values).then(() => {
        setIsOpen(false)
        onClose?.()
      })
    },
  })
  return (
    <>
      <Button icon="add" onClick={() => setIsOpen(true)}>
        New Overlay
      </Button>
      <Dialog style={{ width: '90vw', maxHeight: '80vh' }} title="Create a New Overlay" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={form.handleSubmit}>
          <div style={{ padding: '0.5em' }}>
            <Label>
              Overlay Name
              <InputGroup width={2} id="name" name="name" leftIcon="comment" placeholder="Name" value={form.values.name} onChange={form.handleChange} />
            </Label>
            <Label>
              Overlay Url
              <InputGroup width={2} id="url" name="url" leftIcon="link" placeholder="Url" value={form.values.url} onChange={form.handleChange} />
            </Label>
            <Divider />
            <Label style={{ textAlign: 'center' }}>Window Options</Label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
              }}>
              <Checkbox
                id="transparent"
                name="transparent"
                checked={form.values.transparent}
                onChange={() => {
                  form.setFieldValue('transparent', !form.values.transparent)
                }}>
                Transparency
              </Checkbox>
              <Checkbox
                id="frame"
                name="frame"
                checked={form.values.frame}
                onChange={() => {
                  form.setFieldValue('frame', !form.values.frame)
                }}>
                Frame
              </Checkbox>
              <Checkbox
                id="resizable"
                name="resizable"
                checked={form.values.resizable}
                onChange={() => {
                  form.setFieldValue('resizable', !form.values.resizable)
                }}>
                Resizable
              </Checkbox>
              <Checkbox
                id="alwaysOnTop"
                name="alwaysOnTop"
                checked={form.values.alwaysOnTop}
                onChange={() => {
                  form.setFieldValue('alwaysOnTop', !form.values.alwaysOnTop)
                }}>
                Always on Top
              </Checkbox>
              <Label>
                Width
                <NumericInput
                  fill
                  id="width"
                  name="width"
                  placeholder="Width"
                  value={form.values.width}
                  onValueChange={(e) => {
                    form.setFieldValue('width', e)
                  }}
                />
              </Label>
              <Label>
                Height
                <NumericInput
                  fill
                  id="height"
                  name="height"
                  placeholder="height"
                  value={form.values.height}
                  onValueChange={(e) => {
                    form.setFieldValue('height', e)
                  }}
                />
              </Label>
            </div>
            <div style={{ display: 'flex' }}>
              <Button style={{ flexGrow: 1 }} type="submit">
                Submit
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  )
}
