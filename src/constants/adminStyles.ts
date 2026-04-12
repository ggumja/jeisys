/**
 * Jeisys Medical Admin UI Standard Styles
 * Centralized Tailwind utility classes to maintain consistency and reduce JSX noise.
 */

export const ADMIN_STYLES = {
  // Container & Layout
  PAGE_CONTAINER: "max-w-[1600px] mx-auto px-8 py-8 space-y-8 pb-32",
  CARD: "bg-white border border-neutral-200 p-8 shadow-sm transition-all hover:shadow-md",
  
  // Typography & Headers
  SECTION_TITLE: "text-lg font-bold text-neutral-900 mb-6 border-l-4 border-neutral-900 pl-3 flex items-center justify-between",
  SECTION_LABEL: "block text-sm font-semibold text-neutral-900 mb-2",
  HELPER_TEXT: "text-xs text-neutral-500 mt-1.5 leading-relaxed",
  
  // Forms
  INPUT: "w-full px-4 py-3 border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all placeholder:text-neutral-300",
  SELECT: "w-full px-4 py-3 border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all bg-white cursor-pointer",
  TEXTAREA: "w-full px-4 py-3 border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all min-h-[120px] resize-y",
  
  // Tables
  TABLE_HEADER: "px-4 py-3 text-left text-[11px] font-black text-neutral-500 uppercase tracking-widest bg-neutral-50 border-b border-neutral-200",
  TABLE_CELL: "px-4 py-4 text-sm text-neutral-900 border-b border-neutral-100",
  TABLE_ROW_HOVER: "hover:bg-neutral-50/50 transition-colors",
  
  // Buttons (Base styles if not using Shadcn components)
  BTN_PRIMARY: "px-6 py-3 bg-neutral-900 text-white font-bold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-sm",
  BTN_OUTLINE: "px-6 py-3 border border-neutral-300 text-neutral-900 font-bold text-sm hover:bg-neutral-50 transition-all active:scale-[0.98] disabled:opacity-50",
  BTN_GHOST: "p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all rounded-full",
  
  // Specific UI Elements
  IMAGE_UPLOAD_BOX: "w-40 h-40 border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 relative overflow-hidden cursor-pointer hover:bg-neutral-100 hover:border-neutral-900 transition-all group shadow-sm",
  BADGE_SUCCESS: "inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase ring-1 ring-inset ring-green-600/20",
  BADGE_DANGER: "inline-flex items-center px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase ring-1 ring-inset ring-red-600/20",
  BADGE_NEUTRAL: "inline-flex items-center px-2 py-0.5 bg-neutral-50 text-neutral-600 text-[10px] font-bold uppercase ring-1 ring-inset ring-neutral-500/20",
};

export default ADMIN_STYLES;
