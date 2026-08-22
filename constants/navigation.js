import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarClock,
  MessagesSquare,
  FolderClosed,
  StickyNote,
  BarChart3,
  UserRound,
  Settings,
  TrendingUp,
  Target,
  FileText,
  LineChart,
  PieChart,
  Shield,
  Lightbulb,
  FileBarChart,
  GitBranch,
} from "lucide-react";

// Grouped sidebar navigation. New Phase 2 workspace modules sit alongside the
// Phase 1 account section. Future modules can be appended without changes.
export const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/appointments", label: "Appointments", icon: CalendarClock },
      { href: "/messages", label: "Messages", icon: MessagesSquare, badgeKey: "messages" },
      { href: "/documents", label: "Documents", icon: FolderClosed },
      { href: "/notes", label: "Notes", icon: StickyNote },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Advisory",
    items: [
      { href: "/financial-analysis", label: "Financial Analysis", icon: TrendingUp },
      { href: "/goals", label: "Goal Planning", icon: Target },
      { href: "/financial-plans", label: "Financial Plans", icon: FileText },
      { href: "/investments", label: "Investments", icon: LineChart },
      { href: "/portfolio", label: "Portfolio", icon: PieChart },
      { href: "/risk-assessment", label: "Risk Assessment", icon: Shield },
      { href: "/recommendations", label: "Personalized Advice", icon: Lightbulb },
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/scenario-planner", label: "Scenario Planner", icon: GitBranch },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "My Profile", icon: UserRound },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Flat list kept for backwards compatibility with any existing imports.
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
