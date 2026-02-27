export const STANDARD_PAGE_SIZES = [
  'Letter',
  'Legal',
  'Tabloid',
  'Ledger',
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6'
] as const;

export type StandardPageSize = (typeof STANDARD_PAGE_SIZES)[number];

export type PageSize = StandardPageSize | 'SinglePage';