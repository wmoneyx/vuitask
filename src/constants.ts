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

export const DEFAULT_AVATAR = "data:image/png;base64,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";
