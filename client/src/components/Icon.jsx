// Simple line icons (session 69) in place of emoji, which made Unc look
// AI-made. Phosphor icons, one size and weight everywhere. Usage:
//   <Icon name="pin" />  — decorative, hidden from screen readers.
import {
  Bell, Camera, ChatCircle, CheckCircle, Clock, CreditCard, Eye, Flag, Handshake, Heart, Hourglass, Lightning,
  Lock, MapPin, Money, NotePencil, Package, Plant, Question, SealCheck, Sparkle, Star, Storefront, Trophy,
  VideoCamera, Warning, ArrowBendUpLeft, Gift, Coins, CalendarBlank, XCircle, Info,
  House, MagnifyingGlass, SquaresFour, UserCircle, Plus, ShieldCheck, Translate, ListChecks, SidebarSimple,
  Buildings, Briefcase, Tag,
} from '@phosphor-icons/react';

const ICONS = {
  bell: Bell, camera: Camera, chat: ChatCircle, check: CheckCircle, clock: Clock, card: CreditCard, eye: Eye,
  flag: Flag, deal: Handshake, heart: Heart, hourglass: Hourglass, fast: Lightning, lock: Lock, pin: MapPin,
  money: Money, note: NotePencil, box: Package, plant: Plant, question: Question, found: SealCheck, sparkle: Sparkle,
  star: Star, shop: Storefront, trophy: Trophy, video: VideoCamera, warning: Warning, counter: ArrowBendUpLeft,
  gift: Gift, coins: Coins, calendar: CalendarBlank, cross: XCircle, info: Info,
  home: House, search: MagnifyingGlass, grid: SquaresFour, user: UserCircle, plus: Plus, admin: ShieldCheck,
  language: Translate, list: ListChecks, sidebar: SidebarSimple,
  building: Buildings, briefcase: Briefcase, tag: Tag,
};

export default function Icon({ name, size = '1.05em', weight = 'regular', className = '' }) {
  const C = ICONS[name] || Info;
  return <C size={size} weight={weight} className={`icon ${className}`} aria-hidden="true" focusable="false" />;
}
