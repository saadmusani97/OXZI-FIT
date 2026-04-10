import { Share as NativeShare } from 'react-native'
import * as Sharing from 'expo-sharing'

type ShareTarget = 'instagram' | 'whatsapp' | 'system'

interface ShareSingleOptions {
  social: string
  backgroundImage?: string
  url?: string
  type?: string
  filename?: string
}

interface ShareOpenOptions {
  url: string
  type?: string
  filename?: string
}

interface ReactNativeShareModule {
  Social: {
    INSTAGRAM_STORIES: string
    WHATSAPP: string
  }
  shareSingle: (options: ShareSingleOptions) => Promise<unknown>
  open: (options: ShareOpenOptions) => Promise<unknown>
}

async function getReactNativeShare(): Promise<ReactNativeShareModule | null> {
  try {
    const requiredModule = await import('react-native-share')
    const normalizedModule = requiredModule as unknown as { default?: ReactNativeShareModule } & Partial<ReactNativeShareModule>
    const shareModule = normalizedModule.default ?? normalizedModule

    if (
      shareModule &&
      typeof shareModule.shareSingle === 'function' &&
      typeof shareModule.open === 'function' &&
      typeof shareModule.Social?.INSTAGRAM_STORIES === 'string' &&
      typeof shareModule.Social?.WHATSAPP === 'string'
    ) {
      return shareModule as ReactNativeShareModule
    }

    return null
  } catch {
    return null
  }
}

export async function shareImage(uri: string, target: ShareTarget): Promise<void> {
  const shareModule = await getReactNativeShare()

  if (target === 'instagram' && shareModule) {
    await shareModule.shareSingle({
      social: shareModule.Social.INSTAGRAM_STORIES,
      backgroundImage: uri,
    })
    return
  }

  if (target === 'whatsapp' && shareModule) {
    await shareModule.shareSingle({
      social: shareModule.Social.WHATSAPP,
      url: uri,
      type: 'image/png',
      filename: 'oxzifit-activity.png',
    })
    return
  }

  if (shareModule) {
    await shareModule.open({
      url: uri,
      type: 'image/png',
      filename: 'oxzifit-activity.png',
    })
    return
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share activity',
    })
    return
  }

  await NativeShare.share({
    message: uri,
  })
}
