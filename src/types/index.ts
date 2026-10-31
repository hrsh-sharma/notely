export type PaperStyle = 'ruled' | 'grid' | 'dotted' | 'plain';

export interface Notebook {
  id: string;
  title: string;
  category: string; // e.g., 'Work', 'Journal', 'Ideas', 'Projects', 'Personal'
  subject?: string; // backwards compatibility
  coverColor: string;
  coverPattern?: string;
  paperStyle?: PaperStyle;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  isLocked?: boolean;
  pinCode?: string;
  isPinned?: boolean;
}

export interface Page {
  id: string;
  notebookId: string;
  pageNumber: number;
  content: string; // TipTap JSON content as string
  date?: string;
  createdAt: number;
  updatedAt: number;
}

export type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

export type ViewMode = 'spread' | 'single';

export interface NotebookCover {
  color: string;
  pattern: string;
  label: string;
}

export const CATEGORY_PRESETS = [
  'General',
  'Work & Strategy',
  'Daily Journal',
  'Ideas & Brainstorms',
  'Projects & Code',
  'Writing & Drafts',
  'Reading & Notes',
  'Personal',
];

export const COVER_OPTIONS: NotebookCover[] = [
  { color: '#E85D26', pattern: 'solid', label: 'Classmate Orange' },
  { color: '#1E3A5F', pattern: 'solid', label: 'Oxford Navy' },
  { color: '#1C1917', pattern: 'solid', label: 'Moleskine Black' },
  { color: '#B45309', pattern: 'solid', label: 'Cognac Leather' },
  { color: '#065F46', pattern: 'solid', label: 'Forest Pine' },
  { color: '#7F1D1D', pattern: 'solid', label: 'Burgundy Wine' },
  { color: '#2563EB', pattern: 'solid', label: 'Cobalt Blue' },
  { color: '#0F766E', pattern: 'solid', label: 'Slate Teal' },
  { color: '#4338CA', pattern: 'solid', label: 'Royal Indigo' },
  { color: '#9F1239', pattern: 'solid', label: 'Crimson Rose' },
  { color: '#3F6212', pattern: 'solid', label: 'Olive Green' },
  { color: '#451A03', pattern: 'solid', label: 'Espresso' },
];

export const FONT_FAMILIES = [
  { label: 'Patrick Hand (Handwriting)', value: 'Patrick Hand' },
  { label: 'Caveat (Casual Cursive)', value: 'Caveat' },
  { label: 'Inter (Clean Modern)', value: 'Inter' },
  { label: 'Georgia (Book Serif)', value: 'Georgia' },
  { label: 'Courier New (Typewriter)', value: 'Courier New' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
];

export const FONT_SIZES = [
  { label: '11px', value: '11px' },
  { label: '13px', value: '13px' },
  { label: '15px (Body)', value: '15px' },
  { label: '18px', value: '18px' },
  { label: '21px', value: '21px' },
  { label: '26px (Heading)', value: '26px' },
  { label: '32px (Title)', value: '32px' },
];

export const HIGHLIGHT_COLORS = [
  { label: 'Highlighter Yellow', value: '#FEF08A' },
  { label: 'Mint Green', value: '#BBF7D0' },
  { label: 'Blush Pink', value: '#FBCFE8' },
  { label: 'Sky Blue', value: '#BAE6FD' },
  { label: 'Apricot Orange', value: '#FED7AA' },
];

export const TEXT_COLORS = [
  { label: 'Ballpoint Black', value: '#1E293B' },
  { label: 'Fountain Pen Blue', value: '#1E3A8A' },
  { label: 'Royal Blue', value: '#2563EB' },
  { label: 'Scarlet Ink', value: '#DC2626' },
  { label: 'Emerald Green', value: '#15803D' },
  { label: 'Deep Purple', value: '#7C3AED' },
  { label: 'Amber Bronze', value: '#B45309' },
  { label: 'Pencil Gray', value: '#64748B' },
];
