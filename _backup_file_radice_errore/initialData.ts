import { Organization, User, Eyeglass, Client, Prescription, Sale, AuditLog, AppNotification, UserRole } from '../types';

export const initialOrganization: Organization = {
  id: 'org-1',
  name: 'Studio Ottico Di Pietro',
  tagline: 'Precisione Ottica e Servizio Clienti',
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
    name: 'Filippo',
    username: 'filippo',
    role: 'Amministratore' as UserRole,
    email: 'filippo@studiootticodipietro.it',
    avatarColor: '#8b5360',
    deviceName: 'Smartphone A (Filippo)',
    active: true,
  },
  {
    id: 'user-2',
    name: 'Angela',
    username: 'angela',
    role: 'Operatore' as UserRole,
    email: 'angela@studiootticodipietro.it',
    avatarColor: '#1e3a8a',
    deviceName: 'Smartphone B (Angela)',
    active: true,
  },
];

export const initialEyeglasses: Eyeglass[] = [];

export const initialClients: Client[] = [];

export const initialPrescriptions: Prescription[] = [];

export const initialSales: Sale[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const initialNotifications: AppNotification[] = [];
