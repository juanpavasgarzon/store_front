export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VariantResponse {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  valueType: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  createdAt: string;
  updatedAt: string;
}
