/**
 * Firestore Security Rules Tests
 * Run with: npx vitest run firestore.rules.test.ts
 * Requires Firebase emulator running: firebase emulators:start --only firestore
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertFails,
  assertSucceeds 
} from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  
  const PROJECT_ID = 'test-project-' + Date.now();
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: `
          rules_version = '2';
          
          service cloud.firestore {
            match /databases/{database}/documents {
              function isSignedIn() {
                return request.auth != null;
              }
              
              function isOwner(userId) {
                return isSignedIn() && request.auth.uid == userId;
              }
              
              function isAdmin() {
                return isSignedIn() && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Amministratore';
              }
              
              function isOperatorOrAdmin() {
                return isSignedIn() && 
                  (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Amministratore' ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Operatore');
              }

              match /users/{userId} {
                allow read: if isOwner(userId) || isAdmin();
                allow write: if isOwner(userId) || isAdmin();
              }

              match /organizations/{orgId} {
                allow read: if isAdmin();
                allow write: if isAdmin();
              }

              match /eyeglasses/{eyeglassId} {
                allow read: if isOperatorOrAdmin();
                allow create: if isOperatorOrAdmin();
                allow update: if isOperatorOrAdmin();
                allow delete: if isAdmin();
              }

              match /clients/{clientId} {
                allow read: if isOperatorOrAdmin();
                allow create: if isOperatorOrAdmin();
                allow update: if isOperatorOrAdmin();
                allow delete: if isAdmin();
              }

              match /prescriptions/{prescriptionId} {
                allow read: if isOperatorOrAdmin();
                allow create: if isOperatorOrAdmin();
                allow update: if isOperatorOrAdmin();
                allow delete: if isAdmin();
              }

              match /sales/{saleId} {
                allow read: if isOperatorOrAdmin();
                allow create: if isOperatorOrAdmin();
                allow update: if isAdmin();
                allow delete: if isAdmin();
              }

              match /auditLogs/{logId} {
                allow read: if isOperatorOrAdmin();
                allow create: if isOperatorOrAdmin();
                allow update, delete: if false;
              }

              match /customCategories/{categoryId} {
                allow read: if isOperatorOrAdmin();
                allow create, update, delete: if isOperatorOrAdmin();
              }

              match /settings/{settingId} {
                allow read: if isOperatorOrAdmin();
                allow write: if isAdmin();
              }

              match /syncStatus/{statusId} {
                allow read: if isOperatorOrAdmin();
                allow write: if isOperatorOrAdmin();
              }

              match /{document=**} {
                allow read, write: if false;
              }
            }
          }
        `,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const adminAuth = { uid: 'admin-uid' };
  const operatorAuth = { uid: 'operator-uid' };
  const clientAuth = { uid: 'client-uid' };
  const unauthenticated = null;

  // Helper to set up user documents
  async function setupUsers(db: any) {
    await db.collection('users').doc('admin-uid').set({
      role: 'Amministratore',
      name: 'Admin User',
      email: 'admin@test.com',
    });
    await db.collection('users').doc('operator-uid').set({
      role: 'Operatore',
      name: 'Operator User',
      email: 'operator@test.com',
    });
    await db.collection('users').doc('client-uid').set({
      role: 'Cliente',
      name: 'Client User',
      email: 'client@test.com',
    });
  }

  describe('Users collection', () => {
    it('allows admin to read all users', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('users').doc('operator-uid').get());
    });

    it('allows user to read own document', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('users').doc('operator-uid').get());
    });

    it('denies user reading another user', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('users').doc('admin-uid').get());
    });

    it('denies unauthenticated access', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('users').doc('admin-uid').get());
    });
  });

  describe('Eyeglasses collection', () => {
    it('allows admin to read eyeglasses', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to read eyeglasses', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to create eyeglass', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('eyeglasses').add({
        brand: 'Ray-Ban',
        model: 'Aviator',
        salePrice: 150,
      }));
    });

    it('allows operator to update eyeglass', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('eyeglasses').add({ brand: 'Test' });
      await assertSucceeds(docRef.update({ salePrice: 200 }));
    });

    it('denies operator deleting eyeglass', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('eyeglasses').add({ brand: 'Test' });
      await assertFails(docRef.delete());
    });

    it('allows admin to delete eyeglass', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('eyeglasses').add({ brand: 'Test' });
      await assertSucceeds(docRef.delete());
    });

    it('denies unauthenticated access', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('eyeglasses').doc('eg-1').get());
    });
  });

  describe('Clients collection', () => {
    it('allows operator to read clients', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('clients').doc('cl-1').get());
    });

    it('allows operator to create client', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('clients').add({
        firstName: 'Mario',
        lastName: 'Rossi',
        fiscalCode: 'RSSMRA80C15H501Z',
      }));
    });

    it('denies unauthenticated access', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('clients').doc('cl-1').get());
    });
  });

  describe('Sales collection', () => {
    it('allows operator to create sale', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('sales').add({
        productId: 'eg-1',
        finalPrice: 150,
        paymentMethod: 'Contanti',
      }));
    });

    it('denies operator updating sale', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('sales').add({ finalPrice: 100 });
      await assertFails(docRef.update({ finalPrice: 200 }));
    });

    it('allows admin to update sale', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('sales').add({ finalPrice: 100 });
      await assertSucceeds(docRef.update({ finalPrice: 200 }));
    });
  });

  describe('AuditLogs collection', () => {
    it('allows operator to read audit logs', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('auditLogs').doc('log-1').get());
    });

    it('allows operator to create audit log', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('auditLogs').add({
        entityType: 'Prodotto',
        operation: 'CREAZIONE',
        details: 'Test',
      }));
    });

    it('denies updating audit log (immutable)', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('auditLogs').add({ entityType: 'Test' });
      await assertFails(docRef.update({ details: 'Modified' }));
    });

    it('denies deleting audit log (immutable)', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('auditLogs').add({ entityType: 'Test' });
      await assertFails(docRef.delete());
    });
  });

  describe('CustomCategories collection', () => {
    it('allows operator full CRUD', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      
      const docRef = await assertSucceeds(db.collection('customCategories').add({ name: 'Test' }));
      await assertSucceeds(docRef.update({ name: 'Updated' }));
      await assertSucceeds(docRef.delete());
    });
  });

  describe('Settings collection', () => {
    it('allows operator to read settings', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('settings').doc('general').get());
    });

    it('denies operator writing settings', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('settings').doc('general').set({ theme: 'dark' }));
    });

    it('allows admin to write settings', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('settings').doc('general').set({ theme: 'dark' }));
    });
  });
});
