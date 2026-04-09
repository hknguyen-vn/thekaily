export type Gender = 'male' | 'female' | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  gender: Gender;
  dateOfBirth?: string;
  parentIds: string[];
  spouseIds: string[];
  childrenIds: string[];
  avatar?: string;
  bio?: string;
}

export interface FamilyTreeData {
  members: FamilyMember[];
}
