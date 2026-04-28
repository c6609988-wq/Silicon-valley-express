export const platformLabel: Record<string, string> = {
  twitter: 'Twitter', x: 'Twitter',
  youtube: 'YouTube',
  rss: 'RSS', blog: 'Blog',
  wechat: '微信', website: 'Web', podcast: 'Podcast',
};

interface PlatformIconProps {
  type: string;
  size?: number;
  color?: string;
}

export const PlatformIcon = ({ type, size = 12, color = '#1A73E8' }: PlatformIconProps) => {
  if (type === 'twitter' || type === 'x') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ borderRadius: 2, flexShrink: 0 }}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (type === 'youtube') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ borderRadius: 2, flexShrink: 0 }}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ borderRadius: 2, flexShrink: 0 }}>
      <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
    </svg>
  );
};
