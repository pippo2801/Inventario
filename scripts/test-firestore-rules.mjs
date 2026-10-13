import { readFile } from 'node:fs/promises';
import {
  assertFails,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const projectId = 'demo-inventario-rules';
const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: { rules },
});

try {
  const anonymousDb = testEnv.unauthenticatedContext().firestore();
  const authenticatedDb = testEnv.authenticatedContext('test-user-1').firestore();
  const path = 'organizations/test-org/synthetic-record';

  await assertFails(getDoc(doc(anonymousDb, path)));
  await assertFails(setDoc(doc(anonymousDb, path), { synthetic: true }));
  await assertFails(getDoc(doc(authenticatedDb, path)));
  await assertFails(setDoc(doc(authenticatedDb, path), { synthetic: true }));

  console.log('PASS: Firestore denies reads/writes to anonymous and authenticated clients.');
} finally {
  await testEnv.cleanup();
}
