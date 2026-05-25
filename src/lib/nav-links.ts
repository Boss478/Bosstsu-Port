export interface NavItem {
  href: string;
  label: string;
  icon: string;
  subItems?: NavItem[];
}

export const navLinks: NavItem[] = [
  { href: '/', label: 'หน้าหลัก', icon: 'fi fi-sr-home' },
  {
    href: '/portfolio',
    label: 'ผลงาน',
    icon: 'fi fi-sr-briefcase',
    subItems: [
      { href: '/portfolio', label: 'ผลงาน', icon: 'fi fi-sr-briefcase' },
      { href: '/gallery', label: 'แกลเลอรี่', icon: 'fi fi-sr-picture' }
    ]
  },
  {
    href: '/resources',
    label: 'สื่อการเรียนรู้',
    icon: 'fi fi-sr-gamepad',
    subItems: [
      { href: '/resources', label: 'สื่อ', icon: 'fi fi-sr-book-alt' },
      { href: '/games', label: 'เกม', icon: 'fi fi-sr-gamepad' }
    ]
  },
  { href: '/about-me', label: "About me", icon: 'fi fi-sr-user' },
];
