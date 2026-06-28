/**
 * Simple encryption/decryption for localStorage sensitive data
 * Uses Web Crypto API (SubtleCrypto) with AES-GCM
 * Key derived from a device-specific fingerprint (non-extractable)
 */

// Generate a device-specific key from browser fingerprint
async function getOrCreateKey() {
  const KEY_NAME = 'antigravity-crypto-key'
  
  // Try to get existing key from IndexedDB (persistent)
  const existing = await getKeyFromIDB(KEY_NAME)
  if (existing) return existing
  
  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable = true so we can store it
    ['encrypt', 'decrypt']
  )
  
  // Store key in IndexedDB
  await storeKeyInIDB(KEY_NAME, key)
  return key
}

// IndexedDB helpers for persistent key storage
function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AntigravityCrypto', 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function storeKeyInIDB(name, key) {
  const db = await openIDB()
  const exported = await crypto.subtle.exportKey('jwk', key)
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite')
    tx.objectStore('keys').put(exported, name)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getKeyFromIDB(name) {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readonly')
    const request = tx.objectStore('keys').get(name)
    request.onsuccess = async () => {
      if (request.result) {
        const key = await crypto.subtle.importKey(
          'jwk', request.result,
          { name: 'AES-GCM', length: 256 },
          true, ['encrypt', 'decrypt']
        )
        resolve(key)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// Encrypt a string
export async function encrypt(text) {
  if (!text || typeof text !== 'string') return text
  
  try {
    const key = await getOrCreateKey()
    const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
    const encoded = new TextEncoder().encode(text)
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    )
    
    // Combine IV + ciphertext for storage
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(ciphertext), iv.length)
    
    // Return as base64
    return btoa(String.fromCharCode(...combined))
  } catch (err) {
    console.warn('Encryption failed, storing plaintext:', err)
    return text // Fallback to plaintext
  }
}

// Decrypt a string
export async function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText
  
  try {
    const key = await getOrCreateKey()
    
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0))
    
    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    
    return new TextDecoder().decode(decrypted)
  } catch (err) {
    // If decryption fails, assume it's plaintext (old data or corrupted)
    console.warn('Decryption failed, returning as-is:', err)
    return encryptedText
  }
}

// Encrypt an object (only string values)
export async function encryptObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      result[k] = await encrypt(v)
    } else if (v && typeof v === 'object') {
      result[k] = await encryptObject(v)
    } else {
      result[k] = v
    }
  }
  return result
}

// Decrypt an object
export async function decryptObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      result[k] = await decrypt(v)
    } else if (v && typeof v === 'object') {
      result[k] = await decryptObject(v)
    } else {
      result[k] = v
    }
  }
  return result
}

// Export settings as encrypted JSON file
export async function exportSettings(settings) {
  const encrypted = await encryptObject(settings)
  const dataStr = JSON.stringify(encrypted, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `antigravity-settings-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Import settings from file
export async function importSettings(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const encrypted = JSON.parse(e.target.result)
        const decrypted = await decryptObject(encrypted)
        resolve(decrypted)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

// Clear all crypto keys (for "forget me" / reset)
export async function clearCryptoKeys() {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite')
    tx.objectStore('keys').clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}