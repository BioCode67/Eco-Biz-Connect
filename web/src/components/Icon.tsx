// 일관된 라인 아이콘 세트(이모지·제각각 유니코드 대체). 18px, currentColor stroke.

const PATHS: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
  report: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  won: <><circle cx="12" cy="12" r="9" /><path d="M7 9l2 6 3-6 3 6 2-6M7 12h10" /></>,
  check: <><path d="M5 12.5 10 17l9-10" /></>,
  market: <><path d="M3 9h18l-1.5 11A2 2 0 0 1 17.5 22h-11A2 2 0 0 1 4.5 20L3 9Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>,
  portfolio: <><path d="M3 13a9 9 0 0 1 9-9v9h9a9 9 0 1 1-18 0Z" /><path d="M14 3a7 7 0 0 1 7 7h-7V3Z" /></>,
  monitor: <><path d="M3 12h4l2 6 4-14 2 8h6" /></>,
  spark: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /><path d="m6.3 6.3 3 3M14.7 14.7l3 3M17.7 6.3l-3 3M9.3 14.7l-3 3" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 20a5.5 5.5 0 0 0-3-4.9" /></>,
  log: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /><circle cx="6" cy="8" r="0.6" fill="currentColor" /></>,
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {path}
    </svg>
  );
}
