declare module 'web-push' {
  interface PushSubscription {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  interface VapidDetails {
    subject: string
    publicKey: string
    privateKey: string
  }
  interface SendNotificationOptions {
    vapidDetails?: VapidDetails
    ttl?: number
    urgency?: string
    topic?: string
  }
  export interface VAPIDKeyPair {
    publicKey: string
    privateKey: string
  }
  export function generateVAPIDKeys(): VAPIDKeyPair
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  export function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: SendNotificationOptions
  ): Promise<void>
  const webpush: {
    generateVAPIDKeys: typeof generateVAPIDKeys
    setVapidDetails: typeof setVapidDetails
    sendNotification: typeof sendNotification
  }
  export default webpush
}