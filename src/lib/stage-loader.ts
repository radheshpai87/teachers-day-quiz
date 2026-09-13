import crypto from 'node:crypto'
import encryptedData from '@/data/stage-encrypted.json'
import type { StageData } from '@/data/stage-rounds-data'

interface EncryptedBundle {
  iv: string
  tag: string
  data: string
}

let cachedStageData: StageData | null = null

export function getStageData(): StageData | null {
  if (cachedStageData) return cachedStageData

  const secretKeyHex = process.env.QUIZ_SEED_KEY?.trim()
  if (!secretKeyHex) {
    console.warn('[Stage Engine] No QUIZ_SEED_KEY configured. Unable to decrypt stage data.')
    return null
  }

  try {
    const bundle = encryptedData as EncryptedBundle
    const key = Buffer.from(secretKeyHex, 'hex')
    if (key.length !== 32) {
      console.error('[Stage Engine] QUIZ_SEED_KEY must be a 64-character (32-byte) hex string.')
      return null
    }

    const iv = Buffer.from(bundle.iv, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(Buffer.from(bundle.tag, 'hex'))
    let decrypted = decipher.update(bundle.data, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    cachedStageData = JSON.parse(decrypted) as StageData
    return cachedStageData
  } catch (err) {
    console.error('[Stage Engine] Failed to decrypt stage data with QUIZ_SEED_KEY:', err)
    return null
  }
}
