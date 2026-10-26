import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';
import type { Automovel } from '../../models/automovel';
import type { AutomovelRepository } from '../automovelRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'automoveis';

export function createFirestoreAutomovelRepository(db: Firestore): AutomovelRepository {
  const automoveis = collection(db, COLLECTION);

  return {
    async list({ cor, marca } = {}) {
      const filtros: QueryConstraint[] = [];
      if (cor) filtros.push(where('cor', '==', cor));
      if (marca) filtros.push(where('marca', '==', marca));

      const snapshot = await getDocs(query(automoveis, ...filtros));
      return snapshot.docs.map((d) => toEntity<Automovel>(d));
    },

    async findById(id) {
      const snapshot = await getDoc(doc(automoveis, id));
      return snapshot.exists() ? toEntity<Automovel>(snapshot) : null;
    },

    async findByPlaca(placa) {
      const snapshot = await getDocs(query(automoveis, where('placa', '==', placa), limit(1)));
      const encontrado = snapshot.docs[0];
      return encontrado ? toEntity<Automovel>(encontrado) : null;
    },

    async create(data) {
      const now = new Date();
      const ref = await addDoc(automoveis, { ...data, createdAt: now, updatedAt: now });
      return toEntity<Automovel>(await getDoc(ref));
    },

    async update(id, data) {
      const ref = doc(automoveis, id);
      await updateDoc(ref, { ...data, updatedAt: new Date() });
      return toEntity<Automovel>(await getDoc(ref));
    },

    async delete(id) {
      await deleteDoc(doc(automoveis, id));
    },
  };
}
