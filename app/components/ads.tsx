"use client";

import Script from "next/script";
import { useEffect } from "react";

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";
const ADSENSE_SLOTS = {
  inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || "",
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || "",
  mobile: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE || "",
};

const ADFIT_UNITS = {
  inline: process.env.NEXT_PUBLIC_ADFIT_UNIT_INLINE || "",
  sidebar: process.env.NEXT_PUBLIC_ADFIT_UNIT_SIDEBAR || "",
  mobile: process.env.NEXT_PUBLIC_ADFIT_UNIT_MOBILE || "",
};

type Placement = "inline" | "sidebar" | "mobile";

function AdSenseBlock({ placement }: { placement: Placement }) {
  const slot = ADSENSE_SLOTS[placement];

  useEffect(() => {
    if (!ADS_ENABLED || !ADSENSE_CLIENT || !slot) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // noop
    }
  }, [placement, slot]);

  if (!ADSENSE_CLIENT || !slot) return null;

  return (
    <ins
      className="adsbygoogle block w-full overflow-hidden rounded-lg border border-gray-200 bg-white/90"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

function AdFitBlock({ placement }: { placement: Placement }) {
  const unit = ADFIT_UNITS[placement];
  if (!unit) return null;

  return (
    <ins
      className="kakao_ad_area block w-full overflow-hidden rounded-lg border border-gray-200 bg-white/90"
      style={{ display: "none" }}
      data-ad-unit={unit}
      data-ad-width="320"
      data-ad-height={placement === "sidebar" ? "600" : "100"}
    />
  );
}

export function AdsScripts() {
  if (!ADS_ENABLED) return null;

  return (
    <>
      {ADSENSE_CLIENT ? (
        <Script
          id="adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      ) : null}
      <Script
        id="adfit-script"
        src="//t1.daumcdn.net/kas/static/ba.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}

export function AdSlot({ placement, className = "" }: { placement: Placement; className?: string }) {
  if (!ADS_ENABLED) return null;

  const hasAdSense = !!(ADSENSE_CLIENT && ADSENSE_SLOTS[placement]);
  const hasAdFit = !!ADFIT_UNITS[placement];

  return (
    <div className={`w-full rounded-xl bg-white/50 p-2 ${className}`}>
      <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sponsored</div>

      {hasAdSense ? <AdSenseBlock placement={placement} /> : null}
      {hasAdFit ? <AdFitBlock placement={placement} /> : null}

      {!hasAdSense && !hasAdFit ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 px-3 py-4 text-center text-xs text-gray-400">
          Ad placeholder ({placement})
        </div>
      ) : null}
    </div>
  );
}
