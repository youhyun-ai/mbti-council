# MBTI Council (vitric.ai)

## Ad Monetization (Google AdSense + Kakao AdFit)

Ad rendering is controlled by a feature flag so monetization can be enabled/disabled instantly.

### 1) Feature flag

```bash
NEXT_PUBLIC_ADS_ENABLED=false
```

- `false` (default): no ad scripts/slots rendered
- `true`: ad scripts/slots rendered on result page

### 2) Environment variables

```bash
# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_INLINE=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_MOBILE=1234567890

# Kakao AdFit
NEXT_PUBLIC_ADFIT_UNIT_INLINE=DAN-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADFIT_UNIT_SIDEBAR=DAN-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADFIT_UNIT_MOBILE=DAN-xxxxxxxxxxxxxxxx
```

If IDs are not set, placeholder containers render (when `NEXT_PUBLIC_ADS_ENABLED=true`) so UI can still be tested.

### 3) Placements

- **Inline (result area):** after council completion (non-blocking)
- **Desktop sidebar:** sticky right panel on `xl+`
- **Mobile bottom banner:** shown near bottom on completed state

### 4) Notes

- Core council chat flow is unchanged.
- Ads only appear when enabled via feature flag.
- Scripts load `afterInteractive` for minimal impact.
