export type AttributeValueType = 'text' | 'number' | 'boolean' | 'select';

export interface CategoryAttributeResponse {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  valueType: AttributeValueType;
  options: string[];
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attributes: CategoryAttributeResponse[];
}
