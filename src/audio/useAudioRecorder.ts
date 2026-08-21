import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'recorded'
  | 'unsupported'
  | 'denied'
  | 'error'

export interface RecorderState {
  status: RecorderStatus
  blob: Blob | null
  url: string | null
  durationMs: number
  mimeType: string
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c
  }
  return ''
}

export function isAudioRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  )
}

/** Local-only audio recorder built on getUserMedia + MediaRecorder.
 *  Nothing leaves the device. Handles unsupported browsers + denied mics. */
export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>({
    status: isAudioRecordingSupported() ? 'idle' : 'unsupported',
    blob: null,
    url: null,
    durationMs: 0,
    mimeType: '',
  })

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startedAtRef = useRef<number>(0)
  const urlRef = useRef<string | null>(null)

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
  }, [])

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanupStream()
      revokeUrl()
    }
  }, [cleanupStream, revokeUrl])

  const start = useCallback(async () => {
    if (!isAudioRecordingSupported()) {
      setState((s) => ({ ...s, status: 'unsupported' }))
      return
    }
    revokeUrl()
    setState((s) => ({ ...s, status: 'requesting', blob: null, url: null, durationMs: 0 }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        cleanupStream()
        setState({
          status: 'recorded',
          blob,
          url,
          durationMs: Date.now() - startedAtRef.current,
          mimeType: type,
        })
      }
      startedAtRef.current = Date.now()
      recorder.start()
      setState((s) => ({ ...s, status: 'recording', mimeType: recorder.mimeType || mimeType }))
    } catch (err) {
      cleanupStream()
      const denied =
        err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
      setState((s) => ({ ...s, status: denied ? 'denied' : 'error' }))
    }
  }, [cleanupStream, revokeUrl])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    revokeUrl()
    chunksRef.current = []
    setState({
      status: isAudioRecordingSupported() ? 'idle' : 'unsupported',
      blob: null,
      url: null,
      durationMs: 0,
      mimeType: '',
    })
  }, [revokeUrl])

  return { ...state, start, stop, reset }
}
