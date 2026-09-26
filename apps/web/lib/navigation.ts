import {
  BooksIcon,
  ClockIcon,
  FilesIcon,
  FileTextIcon,
  FolderIcon,
  HouseIcon,
  PaletteIcon,
  PresentationChartIcon,
  StarIcon,
  TableIcon,
  TrashIcon,
  UsersIcon,
} from "@phosphor-icons/react";

export const mainItems = [
  { href: "/dashboard", icon: HouseIcon, title: "Home" },
  { href: "/dashboard/projects", icon: FolderIcon, title: "Projects" },
  { href: "/dashboard/my-files", icon: FilesIcon, title: "My Files" },
];

export const collectionItems = [
  { href: "/dashboard/shared", icon: UsersIcon, title: "Shared with me" },
  { href: "/dashboard/recent", icon: ClockIcon, title: "Recent" },
  { href: "/dashboard/starred", icon: StarIcon, title: "Starred" },
  { href: "/dashboard/trash", icon: TrashIcon, title: "Trash" },
];

export const newItems = [
  { href: "/dashboard/docs", icon: FileTextIcon, title: "Doc" },
  {
    href: "/dashboard/presentations",
    icon: PresentationChartIcon,
    title: "Presentation",
  },
  { href: "/dashboard/sheets", icon: TableIcon, title: "Sheet" },
];

export const workspaceItems = [
  {
    href: "/dashboard/knowledge-base",
    icon: BooksIcon,
    title: "Knowledge Base",
  },
  {
    href: "/dashboard/style-profile",
    icon: PaletteIcon,
    title: "Style Profile",
  },
];
