import { FamilyMember } from './types';

export const mockFamilyData: FamilyMember[] = [
  // Generation 1
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Nguyễn Văn An',
    gender: 'male',
    dateOfBirth: '1945-05-15',
    parentIds: [],
    spouseIds: ['550e8400-e29b-41d4-a716-446655440001'],
    childrenIds: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
    bio: 'Ông nội, người sáng lập gia đình.'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Lê Thị Bình',
    gender: 'female',
    dateOfBirth: '1948-08-20',
    parentIds: [],
    spouseIds: ['550e8400-e29b-41d4-a716-446655440000'],
    childrenIds: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'],
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&auto=format&fit=crop',
    bio: 'Bà nội, hiền hậu đảm đang.'
  },

  // Generation 2
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Nguyễn Văn Cường',
    gender: 'male',
    dateOfBirth: '1975-03-10',
    parentIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    spouseIds: ['550e8400-e29b-41d4-a716-446655440003'],
    childrenIds: ['550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    bio: 'Con trai cả, kỹ sư xây dựng.'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Phạm Thị Diệu',
    gender: 'female',
    dateOfBirth: '1978-11-25',
    parentIds: [],
    spouseIds: ['550e8400-e29b-41d4-a716-446655440002'],
    childrenIds: ['550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
    bio: 'Mẹ, giáo viên mầm non.'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Nguyễn Thị Hoa',
    gender: 'female',
    dateOfBirth: '1980-06-12',
    parentIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    spouseIds: ['550e8400-e29b-41d4-a716-446655440005'],
    childrenIds: ['550e8400-e29b-41d4-a716-446655440008'],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    bio: 'Con gái thứ, bác sĩ.'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Trần Văn Hùng',
    gender: 'male',
    dateOfBirth: '1978-02-14',
    parentIds: [],
    spouseIds: ['550e8400-e29b-41d4-a716-446655440004'],
    childrenIds: ['550e8400-e29b-41d4-a716-446655440008'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    bio: 'Con rể, kinh doanh tự do.'
  },

  // Generation 3
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Nguyễn Văn Hải',
    gender: 'male',
    dateOfBirth: '2005-01-05',
    parentIds: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
    spouseIds: [],
    childrenIds: [],
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop',
    bio: 'Cháu đích tôn, sinh viên CNTT.'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Nguyễn Thị Lan',
    gender: 'female',
    dateOfBirth: '2008-09-30',
    parentIds: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
    spouseIds: [],
    childrenIds: [],
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    bio: 'Cháu gái, học sinh cấp 3.'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Trần Thị Mai',
    gender: 'female',
    dateOfBirth: '2010-12-20',
    parentIds: ['550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005'],
    spouseIds: [],
    childrenIds: [],
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&auto=format&fit=crop',
    bio: 'Cháu ngoại, học sinh cấp 2.'
  }
];
