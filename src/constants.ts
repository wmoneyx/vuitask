import {
  LayoutDashboard,
  Gamepad2,
  MessageCircle,
  CheckSquare,
  Crown,
  Star,
  CalendarCheck,
  Gift,
  Trophy,
  Wallet,
  ShieldCheck,
  User,
  Users,
  MessageSquare,
  LifeBuoy,
  Mail,
  LogOut
} from "lucide-react";

export const SIDEBAR_MENUS = [
  {
    title: "VUI ONLINE",
    items: [
      { name: "Tổng quan", path: "/app", icon: LayoutDashboard },
      { name: "Cộng Đồng", path: "/app/community", icon: Users },
      { name: "Mod Game", path: "/app/games", icon: Gamepad2 },
    ]
  },
  {
    title: "NHIỆM VỤ",
    items: [
      { name: "Task", path: "/app/task", icon: CheckSquare },
      { name: "Task Vip", path: "/app/task-vip", icon: Crown },
      { name: "Task Pre", path: "/app/task-pre", icon: Star },
    ]
  },
  {
    title: "PHẦN THƯỞNG",
    items: [
      { name: "Điểm danh", path: "/app/attendance", icon: CalendarCheck },
      { name: "Nạp Giftcode", path: "/app/giftcode", icon: Gift },
      { name: "Xếp hạng", path: "/app/ranking", icon: Trophy },
    ]
  },
  {
    title: "CÁ NHÂN",
    items: [
      { name: "Ví tiền & Rút", path: "/app/wallet", icon: Wallet },
      { name: "Bảo mật & IP", path: "/app/security", icon: ShieldCheck },
      { name: "Hồ sơ cá nhân", path: "/app/profile", icon: User },
      { name: "Giới thiệu Ref", path: "/app/referral", icon: Users },
    ]
  }
];

export const SUPPORT_MENUS = {
  title: "HỖ TRỢ",
  items: [
    { name: "Nhóm Chat Tele", path: "https://t.me/VuiTask_chat", icon: MessageSquare, isExternal: true },
    { name: "Support Vui Tele", path: "https://t.me/VuiTask_admin", icon: LifeBuoy, isExternal: true },
    { name: "Nhóm Nois & Pay", path: "https://t.me/NoiPay_Vuitask", icon: MessageSquare, isExternal: true },
  ]
};

export const STATUS_COLORS = {
  APPROVED: "text-green-500",
  CANCELLED: "text-red-500",
  PENDING: "text-yellow-500",
  OFFLINE: "text-gray-400",
  ERROR: "animate-[pulse-red-green_1s_infinite] font-bold",
};
