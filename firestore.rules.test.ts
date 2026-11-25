/**
 * Firestore Security Rules Tests
 * Run with: npx vitest run firestore.rules.test.ts
 * Requires Firebase emulator running: firebase emulators:start --only firestore
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertFails,
  assertSucceeds 
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { collection, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/** Small compat adapter for the modular Firestore SDK returned by rules-unit-testing v5. */
function wrapDocument(ref: any) {
  return {
    set: (data: unknown) => setDoc(ref, data),
    get: () => getDoc(ref),
    update: (data: unknown) => updateDoc(ref, data),
    delete: () => deleteDoc(ref),
  };
}

function asCompat(db: any) {
  return {
    collection: (name: string) => ({
      doc: (id?: string) => wrapDocument(id ? doc(db, name, id) : doc(collection(db, name))),
      add: async (data: unknown) => wrapDocument(await addDoc(collection(db, name), data)),
    }),
  };
}

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  
  const PROJECT_ID = 'test-project';
  
  beforeAll(async () => {
    // Load the actual firestore.rules file from project root
    const rulesPath = path.join(__dirname, 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf-8');
    
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: 'localhost',
        port: 8080,
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
  // Uses withSecurityRulesDisabled() to bypass rules for test setup
  async function setupUsers() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = asCompat(context.firestore());
      // Main organization users
      await db.collection('users').doc('admin-uid').set({
        role: 'Amministratore',
        active: true,
        name: 'Admin User',
        email: 'admin@test.com',
        organizationId: 'org-main',
      });
      await db.collection('users').doc('operator-uid').set({
        role: 'Operatore',
        active: true,
        name: 'Operator User',
        email: 'operator@test.com',
        organizationId: 'org-main',
      });
      await db.collection('users').doc('client-uid').set({
        role: 'Cliente',
        active: true,
        name: 'Client User',
        email: 'client@test.com',
        organizationId: 'org-main',
      });
      
      // Different organization admin
      await db.collection('users').doc('other-org-admin-uid').set({
        role: 'Amministratore',
        active: true,
        name: 'Other Org Admin',
        email: 'admin@other.com',
        organizationId: 'org-other',
      });
    });
  }

  // Helper to create test data with security rules disabled
  // Use this for test data that would be blocked by rules (cross-org data, audit logs, etc.)
  async function setupTestDataWithRulesDisabled() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = asCompat(context.firestore());
    
    // Cross-org eyeglasses
    await db.collection('eyeglasses').doc('eg-1').set({
      brand: 'Ray-Ban',
      model: 'Aviator',
      salePrice: 150,
      organizationId: 'org-main',
    });
    await db.collection('eyeglasses').doc('eg-other').set({
      brand: 'Other Brand',
      model: 'Other Model',
      salePrice: 200,
      organizationId: 'org-other',
    });
    await db.collection('eyeglasses').doc('eg-test').set({
      brand: 'Test',
      model: 'Test Model',
      salePrice: 100,
      organizationId: 'org-main',
    });
    
    // Cross-org audit logs
    await db.collection('auditLogs').doc('log-1').set({
      entityType: 'Prodotto',
      operation: 'CREAZIONE',
      details: 'Test',
      organizationId: 'org-main',
    });
    await db.collection('auditLogs').doc('log-other').set({
      entityType: 'Prodotto',
      operation: 'CREAZIONE',
      details: 'Other org log',
      organizationId: 'org-other',
    });
    await db.collection('auditLogs').doc('log-test').set({
      entityType: 'Test',
      organizationId: 'org-main',
    });
    
    // Cross-org clients
    await db.collection('clients').doc('cl-1').set({
      firstName: 'Mario',
      lastName: 'Rossi',
      fiscalCode: 'RSSMRA80C15H501Z',
      organizationId: 'org-main',
    });
    
    // Cross-org sales
    await db.collection('sales').doc('sale-1').set({
      productId: 'eg-1',
      finalPrice: 150,
      paymentMethod: 'Contanti',
      organizationId: 'org-main',
    });
    await db.collection('sales').doc('sale-other').set({
      productId: 'eg-other',
      finalPrice: 200,
      paymentMethod: 'Contanti',
      organizationId: 'org-other',
    });
    
    // Custom categories
    await db.collection('customCategories').doc('cat-1').set({
      name: 'Test Category',
      organizationId: 'org-main',
    });
    
    // Settings
    await db.collection('settings').doc('general').set({
      theme: 'light',
      organizationId: 'org-main',
    });
  });
  }

  describe('Users collection - Role Protection', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
    });

    it('denies organization access to an inactive operator', async () => {
      await setupTestDataWithRulesDisabled();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await asCompat(context.firestore()).collection('users').doc('operator-uid').update({ active: false });
      });
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('denies organization administration to an inactive admin', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await asCompat(context.firestore()).collection('users').doc('admin-uid').update({ active: false });
      });
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertFails(db.collection('users').doc('operator-uid').get());
      await assertFails(db.collection('users').doc('new-user').set({
        role: 'Operatore', active: true, name: 'New User', organizationId: 'org-main',
      }));
    });

    it('prevents users from reactivating or disabling their own account', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await asCompat(context.firestore()).collection('users').doc('operator-uid').update({ active: false });
      });
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('users').doc('operator-uid').update({ active: false }));
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await asCompat(context.firestore()).collection('users').doc('operator-uid').update({ active: false });
      });
      await assertFails(db.collection('users').doc('operator-uid').update({ active: true }));
    });

    it('allows an active admin to deactivate a member in the same organization', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertSucceeds(db.collection('users').doc('operator-uid').update({ active: false }));
    });

    it('allows admin to read all users in same org', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertSucceeds(db.collection('users').doc('operator-uid').get());
    });

    it('allows user to read own document', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('users').doc('operator-uid').get());
    });

    it('denies user reading another user in same org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('users').doc('admin-uid').get());
    });

    it('denies unauthenticated access', async () => {
      const db = asCompat(testEnv.unauthenticatedContext().firestore());
      await assertFails(db.collection('users').doc('admin-uid').get());
    });

    it('DENIES admin reading a user from another organization', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertFails(db.collection('users').doc('other-org-admin-uid').get());
    });

    it('DENIES admin updating a user from another organization', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertFails(db.collection('users').doc('other-org-admin-uid').update({
        name: 'Cross-org change',
      }));
    });

    it('DENIES a user changing their own organizationId', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('users').doc('operator-uid').update({
        organizationId: 'org-other',
      }));
    });

    it('DENIES an admin changing their own organizationId', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertFails(db.collection('users').doc('admin-uid').update({
        organizationId: 'org-other',
      }));
    });

    it('DENIES admin deleting a user from another organization', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertFails(db.collection('users').doc('other-org-admin-uid').delete());
    });

    it('DENIES self-promotion to Amministratore', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      // Operator tries to change their own role to Amministratore
      await assertFails(db.collection('users').doc('operator-uid').update({
        role: 'Amministratore',
        active: true,
      }));
    });

    it('DENIES self-demotion from Amministratore', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      // Admin tries to change their own role to Operatore
      await assertFails(db.collection('users').doc('admin-uid').update({
        role: 'Operatore',
        active: true,
      }));
    });

    it('ALLOWS admin to change another user role', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      // Admin can change operator role
      await assertSucceeds(db.collection('users').doc('operator-uid').update({
        role: 'Cliente',
        active: true,
      }));
    });

    it('DENIES non-admin creating users', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('users').doc('new-user').set({
        role: 'Operatore',
        active: true,
        name: 'New User',
        email: 'new@test.com',
        organizationId: 'org-main',
      }));
    });
  });

  describe('Organization Membership Verification', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
    });

    it('allows admin to read own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertSucceeds(db.collection('organizations').doc('org-main').get());
    });

    it('DENIES admin reading other org', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertFails(db.collection('organizations').doc('org-other').get());
    });

    it('DENIES other org admin reading this org', async () => {
      const db = asCompat(testEnv.authenticatedContext('other-org-admin-uid').firestore());
      await assertFails(db.collection('organizations').doc('org-main').get());
    });
  });

  describe('Cross-Organization Data Access', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
      await setupTestDataWithRulesDisabled();
    });

    it('allows operator to read eyeglasses in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('DENIES operator reading eyeglasses in other org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('eyeglasses').doc('eg-other').get());
    });

    it('DENIES other org admin reading this org eyeglasses', async () => {
      const db = asCompat(testEnv.authenticatedContext('other-org-admin-uid').firestore());
      await assertFails(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to create eyeglass in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('eyeglasses').add({
        brand: 'Ray-Ban',
        model: 'Aviator',
        salePrice: 150,
        organizationId: 'org-main',
      }));
    });

    it('DENIES operator creating eyeglass in other org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('eyeglasses').add({
        brand: 'Hack Attempt',
        model: 'Malicious',
        salePrice: 1,
        organizationId: 'org-other',
      }));
    });

    it('DENIES operator updating eyeglass in other org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      const docRef = db.collection('eyeglasses').doc('eg-other');
      await assertFails(docRef.update({ salePrice: 200 }));
    });
  });

  describe('Audit Logs - Immutable and System-Only Creation', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
      await setupTestDataWithRulesDisabled();
    });

    it('allows operator to read audit logs in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('auditLogs').doc('log-1').get());
    });

    it('DENIES operator reading audit logs in other org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('auditLogs').doc('log-other').get());
    });

    it('DENIES operator creating audit logs (only system)', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('auditLogs').add({
        entityType: 'Prodotto',
        operation: 'CREAZIONE',
        details: 'Fake log',
        organizationId: 'org-main',
      }));
    });

    it('DENIES admin creating audit logs (only system)', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertFails(db.collection('auditLogs').add({
        entityType: 'Prodotto',
        operation: 'CREAZIONE',
        details: 'Fake log',
        organizationId: 'org-main',
      }));
    });

    it('DENIES updating audit logs (immutable)', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      const docRef = db.collection('auditLogs').doc('log-1');
      await assertFails(docRef.update({ details: 'Modified' }));
    });

    it('DENIES deleting audit logs (immutable)', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      const docRef = db.collection('auditLogs').doc('log-1');
      await assertFails(docRef.delete());
    });
  });

  describe('Eyeglasses Collection', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
      await setupTestDataWithRulesDisabled();
    });

    it('allows admin to read eyeglasses in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to read eyeglasses in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('eyeglasses').doc('eg-1').get());
    });

    it('allows operator to create eyeglass in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('eyeglasses').add({
        brand: 'Ray-Ban',
        model: 'Aviator',
        salePrice: 150,
        organizationId: 'org-main',
      }));
    });

    it('allows operator to update eyeglass in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      const docRef = await db.collection('eyeglasses').add({ 
        brand: 'Test', 
        organizationId: 'org-main',
      });
      await assertSucceeds(docRef.update({ salePrice: 200 }));
    });

    it('denies operator deleting eyeglass', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      const docRef = await db.collection('eyeglasses').add({ 
        brand: 'Test',
        organizationId: 'org-main',
      });
      await assertFails(docRef.delete());
    });

    it('allows admin to delete eyeglass in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      const docRef = await db.collection('eyeglasses').add({ 
        brand: 'Test',
        organizationId: 'org-main',
      });
      await assertSucceeds(docRef.delete());
    });

    it('denies unauthenticated access', async () => {
      const db = asCompat(testEnv.unauthenticatedContext().firestore());
      await assertFails(db.collection('eyeglasses').doc('eg-1').get());
    });
  });

  describe('Clients Collection', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
      await setupTestDataWithRulesDisabled();
    });

    it('allows operator to read clients in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('clients').doc('cl-1').get());
    });

    it('allows operator to create client in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('clients').add({
        firstName: 'Mario',
        lastName: 'Rossi',
        fiscalCode: 'RSSMRA80C15H501Z',
        organizationId: 'org-main',
      }));
    });

    it('denies unauthenticated access', async () => {
      const db = asCompat(testEnv.unauthenticatedContext().firestore());
      await assertFails(db.collection('clients').doc('cl-1').get());
    });
  });

  describe('Sales Collection', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
      await setupTestDataWithRulesDisabled();
    });

    it('allows operator to create sale in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('sales').add({
        productId: 'eg-1',
        finalPrice: 150,
        paymentMethod: 'Contanti',
        organizationId: 'org-main',
      }));
    });

    it('denies operator updating sale', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      const docRef = await db.collection('sales').add({ 
        finalPrice: 100,
        organizationId: 'org-main',
      });
      await assertFails(docRef.update({ finalPrice: 200 }));
    });

    it('allows admin to update sale in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      const docRef = await db.collection('sales').add({ 
        finalPrice: 100,
        organizationId: 'org-main',
      });
      await assertSucceeds(docRef.update({ finalPrice: 200 }));
    });
  });

  describe('CustomCategories Collection', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
      await setupTestDataWithRulesDisabled();
    });

    it('allows operator full CRUD in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      
      const docRef = await assertSucceeds(db.collection('customCategories').add({ 
        name: 'Test',
        organizationId: 'org-main',
      }));
      await assertSucceeds(docRef.update({ name: 'Updated' }));
      await assertSucceeds(docRef.delete());
    });
  });

  describe('Settings Collection', () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
      await setupUsers();
      await setupTestDataWithRulesDisabled();
    });

    it('allows operator to read settings in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertSucceeds(db.collection('settings').doc('general').get());
    });

    it('denies operator writing settings', async () => {
      const db = asCompat(testEnv.authenticatedContext('operator-uid').firestore());
      await assertFails(db.collection('settings').doc('general').set({ 
        theme: 'dark',
        organizationId: 'org-main',
      }));
    });

    it('allows admin to write settings in own org', async () => {
      const db = asCompat(testEnv.authenticatedContext('admin-uid').firestore());
      await assertSucceeds(db.collection('settings').doc('general').set({ 
        theme: 'dark',
        organizationId: 'org-main',
      }));
    });
  });
});
