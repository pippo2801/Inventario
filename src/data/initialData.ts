import { Organization, User, Eyeglass, Client, Prescription, Sale, AuditLog, AppNotification, UserRole } from '../types';

export const initialOrganization: Organization = {
  id: 'org-1',
  name: 'Studio Ottico Di Pietro',
  tagline: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  vatNumber: '',
  website: '',
};

export const initialUsers: User[] = [
  {
    id: 'user-1',
    name: 'Admin',
    username: 'admin',
    role: 'Amministratore' as UserRole,
    email: 'admin@studiodipietro.it',
    avatarColor: 'bg-[#8b5360]',
    deviceName: 'Studio Main',
    active: true,
  },
];

export const initialEyeglasses: Eyeglass[] = [];

export const initialClients: Client[] = [];

export const initialPrescriptions: Prescription[] = [];

export const initialSales: Sale[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const initialNotifications: AppNotification[] = [];
