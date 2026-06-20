import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

const PATHS: Record<string, React.ReactNode> = {
  // navigation
  home: <path d="M3 11.5 12 4l9 7.5M5 10v10h14V10" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></>,
  library: <><rect x="3" y="4" width="6" height="16" rx="1" /><rect x="11" y="4" width="4" height="16" rx="1" /><path d="m17 5 3.4 1-3 14-3.4-1" /></>,
  store: <path d="M4 9 5.5 4h13L20 9M4 9h16M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  back: <path d="M15 18l-6-6 6-6" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  // finance
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 1-2-2Z" /><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6" /><circle cx="16" cy="13" r="1.3" fill="currentColor" stroke="none" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  deposit: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 21h16" /></>,
  withdraw: <><path d="M12 21V9m0 0-4 4m4-4 4 4" /><path d="M4 3h16" /></>,
  coin: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 2.5-1.5c1.5 0 2.5 1 2.5 2s-1 1.8-2.5 2-2.5 1-2.5 2 1 2 2.5 2a2.5 2.5 0 0 0 2.5-1.5" /></>,
  dollar: <><path d="M12 2v20M16 6.5C16 4.5 14.2 3 12 3S8 4.5 8 6.5 9.8 10 12 10s4 1.5 4 3.5S14.2 17 12 17s-4-1.5-4-3.5" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m7 14 3-3 3 3 4-5" /></>,
  trophy: <><path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" /><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M9 18h6M10 14v4M14 14v4" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8S10 3 7.5 4.5 12 8 12 8ZM12 8s2-5 4.5-3.5S12 8 12 8Z" /></>,
  // product types
  template: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  prompt: <><rect x="4" y="6" width="16" height="12" rx="3" /><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" /><path d="M12 6V3M8 21h8" /></>,
  course: <><path d="M22 9 12 4 2 9l10 5 10-5Z" /><path d="M6 11v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></>,
  ebook: <><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z" /><path d="M8 3v18" /></>,
  preset: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>,
  graphics: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 16-5-5L5 20" /></>,
  font: <path d="M5 19V6h9a3.5 3.5 0 0 1 0 7H5M14 13a3.5 3.5 0 0 1 0 7H5" />,
  planner: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  account: <><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  proxy: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  spark: <path d="M12 3l1.8 4.8L18.6 9 13.8 10.8 12 15.6 10.2 10.8 5.4 9l4.8-1.2L12 3Z" />,
  // ui / actions
  check: <path d="m20 6-11 11-5-5" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>,
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  upload: <><path d="M12 16V4m0 0-4 4m4-4 4 4" /><path d="M4 20h16" /></>,
  download: <><path d="M12 4v12m0 0 4-4m-4 4-4-4" /><path d="M4 20h16" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></>,
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  play: <path d="M6 4l14 8-14 8V4Z" fill="currentColor" stroke="none" />,
  playCircle: <><circle cx="12" cy="12" r="9" /><path d="M10 8.5 16 12l-6 3.5v-7Z" fill="currentColor" stroke="none" /></>,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
  volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M16 9a3 3 0 0 1 0 6" /></>,
  fullscreen: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  dots: <><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />,
  camera: <><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><circle cx="12" cy="13" r="3.5" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  shieldCheck: <><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  ticket: <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" /><path d="M13 6v12" strokeDasharray="2 2" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
  megaphone: <><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15 8a5 5 0 0 1 0 8M11 6l9-3v18l-9-3" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h0M15 7h0M9 11h0M15 11h0M9 15h0M15 15h0M9 21v-3h6v3" /></>,
  doc: <><path d="M6 2h8l6 6v14H6Z" /><path d="M14 2v6h6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h0" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h0" /></>,
  agent: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /><path d="m18 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h12" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
  moon: <path d="M21 12.8A8 8 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />,
  send: <path d="m4 12 16-7-7 16-2.5-6.5L4 12Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  heart: <path d="M12 21s-7-4.4-9.5-9C1 8.5 2.5 5 6 5c2 0 3.3 1.1 4 2 .7-.9 2-2 4-2 3.5 0 5 3.5 3.5 7-2.5 4.6-9.5 9-9.5 9Z" />,
  zap: <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" fill="currentColor" stroke="none" />,
  // socials
  whatsapp: <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3Zm4.3 12.3c-.2.5-1 .9-1.4 1-.4 0-.8.2-2.6-.6-2.2-1-3.6-3.2-3.7-3.4-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.4 0 .5l-.4.5c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2 .7.6 1.3.8 1.6.9.2 0 .4 0 .5-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.2.1.7-.1 1.2Z" fill="currentColor" stroke="none" />,
  telegram: <path d="m21 4-2.5 15c-.2 1-.7 1.2-1.5.8L13 16.6l-2 1.9c-.2.2-.4.4-.8.4l.3-4 7.3-6.6c.3-.3-.1-.4-.5-.2L8 12.5l-3.8-1.2c-.8-.3-.8-.8.2-1.2l14.5-5.6c.7-.3 1.3.2 1.1 1.2Z" fill="currentColor" stroke="none" />,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></>,
  facebook: <path d="M14 8h2V5h-2c-2 0-3 1.3-3 3v2H9v3h2v6h3v-6h2l.5-3H14V8.5c0-.4.2-.5.5-.5Z" fill="currentColor" stroke="none" />,
  tiktok: <path d="M16 3c.3 2 1.5 3.5 3.5 3.8V10c-1.4 0-2.6-.4-3.6-1.1v6.4a5.3 5.3 0 1 1-5.3-5.3c.3 0 .5 0 .8.1v3.1a2.3 2.3 0 1 0 1.6 2.1V3H16Z" fill="currentColor" stroke="none" />,
  twitter: <path d="M4 4l7 9-7 7h2l6-6 4.5 6H22l-7.4-9.8L21 4h-2l-5.4 5.6L9.5 4H4Z" fill="currentColor" stroke="none" />,
  youtube: <><rect x="2" y="6" width="20" height="12" rx="3" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" /></>,
  mail: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="m2 7 10 6 10-6" /></>,
  phone: <path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L19 14l2 5v3h-3A16 16 0 0 1 2 6V3Z" />,
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20, ...props }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

// Map product type → icon name
export function productTypeIcon(type: string): IconName {
  const map: Record<string, IconName> = {
    template: "template", prompt_pack: "prompt", course: "course", ebook: "ebook",
    presets: "preset", graphics: "graphics", fonts: "font", printables: "planner",
    account: "account", proxy: "proxy", other: "spark",
  };
  return map[type] || "spark";
}
