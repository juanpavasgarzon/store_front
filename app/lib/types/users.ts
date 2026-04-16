export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
}
