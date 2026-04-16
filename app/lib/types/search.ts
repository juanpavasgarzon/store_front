export interface SearchResultItem {
  type: 'listing' | 'category';
  id: string;
  title: string;
  slug: string | null;
}

export interface SearchResult {
  data: SearchResultItem[];
  total: number;
}
