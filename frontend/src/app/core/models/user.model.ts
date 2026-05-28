export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
}
