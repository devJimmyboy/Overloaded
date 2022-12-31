import React, { useEffect, useState } from 'react'
import { IOverlay } from '../types'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Label, InputGroup, Divider, Checkbox, NumericInput, Button } from '@blueprintjs/core'
import { useFormik } from 'formik'

type Props = {}

export default function overlay({}: Props) {
  const { overlay } = useParams()
  const [window, setWindow] = useState<IOverlay | null>(null)
  useEffect(() => {
    ipc.invoke('get-overlays').then((wins: IOverlay[]) => {
      const win = wins.find((w) => w.name.toLowerCase() === overlay?.toLowerCase())
      if (!win) return
      setWindow(win!)
    })
  }, [])
  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }} style={{ width: '100%', height: '100%' }}>
      <div style={{ padding: '1em' }}>{window ? <OverlayEditForm overlay={window} /> : <>Loading</>}</div>
    </motion.div>
  )
}

interface OverlayEditFormProps {
  overlay: IOverlay
}
function OverlayEditForm({ overlay }: OverlayEditFormProps) {
  const form = useFormik<IOverlay>({
    initialValues: overlay,
    onSubmit: (values) => {
      ipc.invoke('update-overlay', values).then(() => {
        console.log('updated')
      })
    },
  })
  return (
    <form onSubmit={form.handleSubmit}>
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
      <Divider />
      <div>
        <Button type="submit" intent="success" style={{ width: '100%' }}>
          Save
        </Button>
      </div>
    </form>
  )
}
