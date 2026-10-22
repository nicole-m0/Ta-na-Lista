import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAds } from '../hooks/useAds';
import { adsConfig } from '../services/ads';

export function AdBanner() {
  const { ready, sdk } = useAds();
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);
  if (!ready || !sdk || failed) return null;
  return <View onLayout={event => setWidth(Math.floor(event.nativeEvent.layout.width))} style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
    <Text style={{ fontSize: 11, color: '#5C6862' }}>Publicidade de teste</Text>
    {width > 0 && <sdk.BannerAd key={width} width={width} unitId={adsConfig.androidBannerId} size={sdk.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={adsConfig.requestOptions} onAdFailedToLoad={() => setFailed(true)} />}
  </View>;
}
