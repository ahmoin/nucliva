const kindCycle = [
  "doc",
  "sheet",
  "presentation",
  "doc",
  "doc",
  "sheet",
] as const;

const nameCycle = [
  "Weekly sync notes",
  "Q3 metrics",
  "Onboarding guide",
  "Product roadmap",
  "Brand assets checklist",
  "Customer feedback synthesis for the enterprise segment across every region we operate in",
  "Привет, мир: план проекта на следующий квартал",
  "회의록: 2025년 3분기 제품 전략 검토 및 향후 계획",
  "योजना: तीसरी तिमाही की विपणन रणनीति और बजट",
  "דוח רבעוני: סיכום ביצועים ומטרות לרבעון הבא",
  "Rapport trimestriel : résumé des résultats et objectifs à venir",
  "🎉 Launch party planning 🥳 (guest list, budget, venue options and catering)",
  "Supercalifragilisticexpialidocious_release_notes_v2_final_FINAL_use_this",
  "Q",
  "Untitled",
  "ملاحظات الاجتماع الأسبوعي وخطة العمل للفريق",
  "会议纪要：产品路线图与季度目标回顾",
];

const ownerCycle = [
  "You",
  "Maya Chen",
  "Daniel Okafor",
  "Priya Raman",
  "Aleksandra Wiśniewska-Kowalczyk",
  "山田 太郎",
  "Zoë Ångström-Björk",
  "—",
  "محمد عبد الرحمن",
  "bartholomew.fitzgerald@northwind-industries-holdings.example.com",
  "Jo",
];

const modifiedCycle = [
  "Today, 9:41 AM",
  "Yesterday, 4:30 PM",
  "Sep 22",
  "—",
  "September 15, 2025 at 11:59:59 PM Coordinated Universal Time",
  "Aug 30",
  "Yesterday at 2:15:33 PM (last edited by Christopher Alexander Montgomery III)",
  "2024年9月15日 23:59",
];

const permissionCycle = [
  "Can edit",
  "Can view",
  "Can comment",
  "Can view (access expires in 12 days, request an extension)",
  "—",
];

const deletedCycle = [
  "Deleted just now",
  "Deleted 2 days ago",
  "Deleted 29 days, 23 hours and 59 minutes ago (permanently removed in 1 minute)",
  "Deleted 12 days ago",
];

const generateFiles = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}${index}`,
    kind: kindCycle[index % kindCycle.length] ?? "doc",
    modified: modifiedCycle[(index * 3) % modifiedCycle.length] ?? "—",
    name: `${nameCycle[index % nameCycle.length] ?? "Untitled"} (${index + 1})`,
    owner: ownerCycle[(index * 5) % ownerCycle.length] ?? "You",
    permission: permissionCycle[index % permissionCycle.length] ?? "Can view",
    starred: index % 7 === 0,
  }));

const featuredFiles = [
  {
    id: "1",
    kind: "doc",
    modified: "Today, 9:41 AM",
    name: "Q4 launch",
    owner: "You",
    starred: true,
  },
  {
    id: "2",
    kind: "presentation",
    modified:
      "Today at 8:12:47 AM (last edited by Aleksandra Wiśniewska-Kowalczyk)",
    name: "Investor update for the September board meeting including the revised forecast, the updated hiring plan and every open question from the previous quarter",
    owner: "Aleksandra Wiśniewska-Kowalczyk",
    starred: true,
  },
  {
    id: "3",
    kind: "doc",
    modified: "2025年9月24日 23:59:59 (協定世界時)",
    name: "日本語のドキュメント：第3四半期の製品発表と市場戦略についての詳細な計画",
    owner: "山田 太郎",
    starred: false,
  },
  {
    id: "4",
    kind: "sheet",
    modified: "اليوم، ٩:٤١ صباحًا",
    name: "خطة إطلاق المنتج للربع الرابع وتفاصيل الحملة التسويقية",
    owner: "محمد عبد الرحمن",
    starred: true,
  },
  {
    id: "5",
    kind: "presentation",
    modified: "September 15, 2025 at 11:59:59 PM Coordinated Universal Time",
    name: "🚀 Competitor pricing comparison 🔥 (EU, US, APAC and LATAM) with currency conversions",
    owner: "Zoë Ångström-Björk",
    starred: false,
  },
  {
    id: "6",
    kind: "sheet",
    modified: "Yesterday, 4:30 PM",
    name: "A",
    owner: "You",
    starred: false,
  },
  {
    id: "7",
    kind: "doc",
    modified: "Yesterday, 11:59:59 PM GMT+05:30",
    name: "Supercalifragilisticexpialidocious_Q4_final_FINAL_v27_reallyfinal_use_this_one",
    owner: "bartholomew.fitzgerald@northwind-industries-holdings.example.com",
    starred: true,
  },
  {
    id: "8",
    kind: "presentation",
    modified: "—",
    name: "Untitled",
    owner: "—",
    starred: false,
  },
  {
    id: "9",
    kind: "doc",
    modified: "Sep 22",
    name: "Customer interview notes",
    owner: "Jo",
    starred: false,
  },
] as const;

export const files = [...featuredFiles, ...generateFiles(990, "g")];

const featuredShared = [
  {
    id: "s1",
    kind: "doc",
    modified: "Today, 10:02 AM",
    name: "Marketing plan",
    owner: "Maya Chen",
    permission: "Can edit",
  },
  {
    id: "s2",
    kind: "presentation",
    modified:
      "Yesterday at 2:15:33 PM (last edited by Christopher Alexander Montgomery III)",
    name: "Global sales kickoff: regional breakouts, quota changes, comp plan updates, territory assignments and the full Q1 enablement calendar",
    owner: "Aleksandra Wiśniewska-Kowalczyk, Platform Infrastructure",
    permission: "Can view (access expires in 12 days, request an extension)",
  },
  {
    id: "s3",
    kind: "sheet",
    modified: "Sep 20",
    name: "Q",
    owner: "bartholomew.fitzgerald@northwind-industries-holdings.example.com",
    permission: "Can comment",
  },
  {
    id: "s4",
    kind: "doc",
    modified: "—",
    name: "Untitled",
    owner: "—",
    permission: "—",
  },
] as const;

export const sharedFiles = [...featuredShared, ...generateFiles(196, "sg")];

const featuredTrashed = [
  {
    id: "t1",
    kind: "doc",
    modified: "Deleted 2 days ago",
    name: "Old landing page copy",
    owner: "You",
  },
  {
    id: "t2",
    kind: "presentation",
    modified:
      "Deleted 29 days, 23 hours and 59 minutes ago (permanently removed in 1 minute)",
    name: "Draft pitch (v1) for the seed round, superseded by v2 through v14 and then by the completely rewritten investor narrative",
    owner: "Aleksandra Wiśniewska-Kowalczyk",
  },
  {
    id: "t3",
    kind: "sheet",
    modified: "Deleted just now",
    name: "x",
    owner: "—",
  },
] as const;

export const trashedFiles = [
  ...featuredTrashed,
  ...generateFiles(147, "tg").map((file, index) => ({
    ...file,
    modified: deletedCycle[index % deletedCycle.length] ?? "Deleted just now",
  })),
];

export const projects = [
  {
    description: "Copy, slides and tracking sheet.",
    docs: 6,
    id: "p1",
    name: "Q4 Launch",
    sheets: 2,
    slides: 1,
    updated: "Updated today",
  },
  {
    description:
      "Every investor update, board presentation, data room export, diligence questionnaire, cap table snapshot, term sheet revision, side letter and supporting financial model we have produced since the very first pre-seed conversation, kept in one place so nothing gets lost.",
    docs: 12_483,
    id: "p2",
    name: "Investor Relations, Board Governance and Strategic Partnerships (Confidential, Do Not Distribute)",
    sheets: 98_765,
    slides: 1204,
    updated:
      "Updated yesterday at 11:59:59 PM by Christopher Alexander Montgomery III",
  },
  {
    description: "-",
    docs: 0,
    id: "p3",
    name: "A",
    sheets: 0,
    slides: 0,
    updated: "Never updated",
  },
  {
    description:
      "Supercalifragilisticexpialidocious_customer_research_synthesis_workspace_for_the_enterprise_segment_only",
    docs: 9,
    id: "p4",
    name: "顧客リサーチと市場調査プロジェクト：エンタープライズ向け",
    sheets: 3,
    slides: 2,
    updated: "Updated Sep 14",
  },
  {
    description: "خطط وأبحاث وموارد فريق التسويق للعام القادم",
    docs: 31,
    id: "p5",
    name: "مشروع التسويق الإقليمي للشرق الأوسط",
    sheets: 7,
    slides: 4,
    updated: "تم التحديث أمس",
  },
  {
    description: "🎯 OKRs, roadmap 🗺️ and weekly reviews 📅",
    docs: 18,
    id: "p6",
    name: "🚀 Growth Team 🔥",
    sheets: 5,
    slides: 3,
    updated: "Updated Sep 03",
  },
] as const;

export const connectors = [
  {
    description: "Import docs, slides and sheets.",
    id: "c1",
    name: "Google Drive",
    status: "Connected",
  },
  {
    description:
      "Sync every page, database, template and comment thread from all of your workspaces, including archived pages, deleted pages in the trash and pages other people shared with you.",
    id: "c2",
    name: "Notion for Enterprise (Legacy Sync, Read Only)",
    status: "Reconnection required: access token expired",
  },
  {
    description: "—",
    id: "c3",
    name: "Slack",
    status: "Not connected",
  },
  {
    description: "Upload PDFs, text and markdown from your computer.",
    id: "c4",
    name: "Local files",
    status: "Available",
  },
] as const;

export const indexedSources = [
  {
    chunks: 128,
    id: "i1",
    name: "Brand voice",
    source: "Google Drive",
    updated: "Today",
  },
  {
    chunks: 1_234_567,
    id: "i2",
    name: "Product requirements document, version 3.2.1-rc4, including appendices A through Q, the full API changelog and every stakeholder comment from the review",
    source:
      "Google Drive (shared drive: Engineering, Platform Infrastructure and Reliability)",
    updated: "Yesterday at 11:59:59 PM GMT+05:30",
  },
  {
    chunks: 0,
    id: "i3",
    name: "x",
    source: "—",
    updated: "—",
  },
  {
    chunks: 57,
    id: "i4",
    name: "Customer FAQ",
    source: "Local files",
    updated: "Sep 18",
  },
  {
    chunks: 4210,
    id: "i5",
    name: "製品仕様書：バージョン3.2、付録A〜Q",
    source: "ローカルファイル",
    updated: "2025年9月18日",
  },
  {
    chunks: 96,
    id: "i6",
    name: "دليل العلامة التجارية وإرشادات الاستخدام",
    source: "Google Drive",
    updated: "أمس",
  },
] as const;

export const toneMarkers = [
  {
    description: "Casual, with contractions.",
    id: "m1",
    title: "Formality",
    value: "Informal",
  },
  {
    description:
      "Long, winding sentences full of subordinate clauses, parenthetical asides, semicolons and the occasional rhetorical question that never quite gets answered before the paragraph ends.",
    id: "m2",
    title: "Sentence structure",
    value:
      "Highly variable, alternating between clipped fragments and sprawling multi-clause sentences",
  },
  {
    description: "—",
    id: "m3",
    title: "Vocabulary",
    value: "—",
  },
] as const;

export const writingSamples = [
  {
    added: "Sep 24",
    id: "w1",
    source: "Email",
    title: "Hi",
    words: 4,
  },
  {
    added: "September 22, 2025 at 11:59:59 PM Coordinated Universal Time",
    id: "w2",
    source: "Document imported from Google Drive (shared drive)",
    title:
      "Weekly product update covering roadmap changes, customer escalations, hiring, incident postmortems, pricing experiments and the plan for the next three quarters",
    words: 1_204_338,
  },
  {
    added: "Sep 18",
    id: "w3",
    source: "Note",
    title: "Founder letter draft",
    words: 385,
  },
  {
    added: "—",
    id: "w4",
    source: "—",
    title: "خطاب المؤسس إلى الفريق",
    words: 0,
  },
  {
    added: "2025年9月10日",
    id: "w5",
    source: "メール",
    title: "チームへの週次アップデートと今後の予定について",
    words: 512,
  },
] as const;
