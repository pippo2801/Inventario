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
import * as fs from 'fs';
import * as path from 'path';

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  
  const PROJECT_ID = 'test-project-' + Date.now();
  
  beforeAll(async () => {
    // Load the actual firestore.rules file
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf-8');
    
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const adminAuth = { uid: 'admin-uid' };
  const operatorAuth = { uid: 'operator-uid' };
  const clientAuth = { uid: 'client-uid' };
  const otherOrgAdminAuth = { uid: 'other-org-admin-uid' };
  const unauthenticated = null;

  // Helper to set up user documents with organization membership
  async function setupUsers(db: any) {
    // Main organization users
    await db.collection('users').doc('admin-uid').set({
      role: 'Amministratore',
      name: 'Admin User',
      email: 'admin@test.com',
      organizationId: 'org-main',
    });
    await db.collection('users').doc('operator-uid').set({
      role: 'Operatore',
      name: 'Operator User',
      email: 'operator@test.com',
      organizationId: 'org-main',
    });
    await db.collection('users').doc('client-uid').set({
      role: 'Cliente',
      name: 'Client User',
      email: 'client@test.com',
      organizationId: 'org-main',
    });
    
    // Different organization admin
    await db.collection('users').doc('other-org-admin-uid').set({
      role: 'Amministratore',
      name: 'Other Org Admin',
      email: 'admin@other.com',
      organizationId: 'org-other',
    });
  }

  describe('Users collection - Role Protection', () => {
    it('allows admin to read all users in same org', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('users').doc('operator-uid').get());
    });

    it('allows user to read own document', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('users').doc('operator-uid').get());
    });

    it('denies user reading another user in same org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('users').doc('admin-uid').get());
    });

    it('denies unauthenticated access', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('users').doc('admin-uid').get());
    });

    it('DENIES self-promotion to Amministratore', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      // Operator tries to change their own role to Amministratore
      await assertFails(db.collection('users').doc('operator-uid').update({
        role: 'Amministratore',
      }));
    });

    it('DENIES self-demotion from Amministratore', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      // Admin tries to change their own role to Operatore
      await assertFails(db.collection('users').doc('admin-uid').update({
        role: 'Operatore',
      }));
    });

    it('ALLOWS admin to change another user role', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      // Admin can change operator role
      await assertSucceeds(db.collection('users').doc('operator-uid').update({
        role: 'Cliente',
      }));
    });

    it('DENIES non-admin creating users', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('users').doc('new-user').set({
        role: 'Operatore',
        name: 'New User',
        email: 'new@test.com',
        organizationId: 'org-main',
      }));
    });
  });

  describe('Organization Membership Verification', () => {
    it('allows admin to read own org', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('organizations').doc('org-main').get());
    });

    it('DENIES admin reading other org', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('organizations').doc('org-other').get());
    });

    it('DENIES other org admin reading this org', async () => {
      const db = testEnv.authenticatedContext('other-org-admin-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('organizations').doc('org-main').get());
    });
  });

  describe('Cross-Organization Data Access', () => {
    it('allows operator to read eyeglasses in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await db.collection('eyeglasses').doc('eg-1').set({
        brand: 'Ray-Ban',
        model: 'Aviator',
        salePrice: 150,
        organizationId: 'org-main',
      });
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('DENIES operator reading eyeglasses in other org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await db.collection('eyeglasses').doc('eg-other').set({
        brand: 'Other Brand',
        model: 'Other Model',
        salePrice: 200,
        organizationId: 'org-other',
      });
      await assertFails(db.collection('eyeglasses').doc('eg-other').get());
    });

    it('DENIES other org admin reading this org eyeglasses', async () => {
      const db = testEnv.authenticatedContext('other-org-admin-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to create eyeglass in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('eyeglasses').add({
        brand: 'Ray-Ban',
        model: 'Aviator',
        salePrice: 150,
        organizationId: 'org-main',
      }));
    });

    it('DENIES operator creating eyeglass in other org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('eyeglasses').add({
        brand: 'Hack Attempt',
        model: 'Malicious',
        salePrice: 1,
        organizationId: 'org-other',
      }));
    });

    it('DENIES operator updating eyeglass in other org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('eyeglasses').add({
        brand: 'Other',
        model: 'Model',
        salePrice: 100,
        organizationId: 'org-other',
      });
      await assertFails(docRef.update({ salePrice: 200 }));
    });
  });

  describe('Audit Logs - Immutable and System-Only Creation', () => {
    it('allows operator to read audit logs in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await db.collection('auditLogs').doc('log-1').set({
        entityType: 'Prodotto',
        operation: 'CREAZIONE',
        details: 'Test',
        organizationId: 'org-main',
      });
      await assertSucceeds(db.collection('auditLogs').doc('log-1').get());
    });

    it('DENIES operator reading audit logs in other org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('auditLogs').doc('log-other').get());
    });

    it('DENIES operator creating audit logs (only system)', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('auditLogs').add({
        entityType: 'Prodotto',
        operation: 'CREAZIONE',
        details: 'Fake log',
        organizationId: 'org-main',
      }));
    });

    it('DENIES admin creating audit logs (only system)', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('auditLogs').add({
        entityType: 'Prodotto',
        operation: 'CREAZIONE',
        details: 'Fake log',
        organizationId: 'org-main',
      }));
    });

    it('DENIES updating audit logs (immutable)', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('auditLogs').add({ 
        entityType: 'Test',
        organizationId: 'org-main',
      });
      await assertFails(docRef.update({ details: 'Modified' }));
    });

    it('DENIES deleting audit logs (immutable)', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('auditLogs').add({ 
        entityType: 'Test',
        organizationId: 'org-main',
      });
      await assertFails(docRef.delete());
    });
  });

  describe('Eyeglasses Collection', () => {
    it('allows admin to read eyeglasses in own org', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to read eyeglasses in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to create eyeglass in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('eyeglasses').add({
        brand: 'Ray-Ban',
        model: 'Aviator',
        salePrice: 150,
        organizationId: 'org-main',
      }));
    });

    it('allows operator to update eyeglass in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('eyeglasses').add({ 
        brand: 'Test', 
        organizationId: 'org-main',
      });
      await assertSucceeds(docRef.update({ salePrice: 200 }));
    });

    it('denies operator deleting eyeglass', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('eyeglasses').add({ 
        brand: 'Test',
        organizationId: 'org-main',
      });
      await assertFails(docRef.delete());
    });

    it('allows admin to delete eyeglass in own org', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('eyeglasses').add({ 
        brand: 'Test',
        organizationId: 'org-main',
      });
      await assertSucceeds(docRef.delete());
    });

    it('denies unauthenticated access', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('eyeglasses').doc('eg-1').get());
    });
  });

  describe('Clients Collection', () => {
    it('allows operator to read clients in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('clients').doc('cl-1').get());
    });

    it('allows operator to create client in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('clients').add({
        firstName: 'Mario',
        lastName: 'Rossi',
        fiscalCode: 'RSSMRA80C15H501Z',
        organizationId: 'org-main',
      }));
    });

    it('denies unauthenticated access', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('clients').doc('cl-1').get());
    });
  });

  describe('Sales Collection', () => {
    it('allows operator to create sale in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('sales').add({
        productId: 'eg-1',
        finalPrice: 150,
        paymentMethod: 'Contanti',
        organizationId: 'org-main',
      }));
    });

    it('denies operator updating sale', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('sales').add({ 
        finalPrice: 100,
        organizationId: 'org-main',
      });
      await assertFails(docRef.update({ finalPrice: 200 }));
    });

    it('allows admin to update sale in own org', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      const docRef = await db.collection('sales').add({ 
        finalPrice: 100,
        organizationId: 'org-main',
      });
      await assertSucceeds(docRef.update({ finalPrice: 200 }));
    });
  });

  describe('CustomCategories Collection', () => {
    it('allows operator full CRUD in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      
      const docRef = await assertSucceeds(db.collection('customCategories').add({ 
        name: 'Test',
        organizationId: 'org-main',
      }));
      await assertSucceeds(docRef.update({ name: 'Updated' }));
      await assertSucceeds(docRef.delete());
    });
  });

  describe('Settings Collection', () => {
    it('allows operator to read settings in own org', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('settings').doc('general').get());
    });

    it('denies operator writing settings', async () => {
      const db = testEnv.authenticatedContext('operator-uid').firestore();
      await setupUsers(db);
      await assertFails(db.collection('settings').doc('general').set({ 
        theme: 'dark',
        organizationId: 'org-main',
      }));
    });

    it('allows admin to write settings in own org', async () => {
      const db = testEnv.authenticatedContext('admin-uid').firestore();
      await setupUsers(db);
      await assertSucceeds(db.collection('settings').doc('general').set({ 
        theme: 'dark',
        organizationId: 'org-main',
      }));
    });
  });
});
