// src/scripts/cleanDatabase.js
// Script para limpiar completamente la base de datos Firebase

import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza completa de la base de datos...');
  
  const collections = [
    'users',
    'listings', 
    'transactions',
    'notifications',
    'ratings',
    'disputes',
    'binders'
  ];

  try {
    let totalDeleted = 0;

    for (const collectionName of collections) {
      console.log(`🗑️ Limpiando collection: ${collectionName}`);
      
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`✅ Collection ${collectionName} ya está vacía`);
        continue;
      }

      // Usar batch para eliminar documentos en grupos de 500
      const docs = snapshot.docs;
      console.log(`📊 Encontrados ${docs.length} documentos en ${collectionName}`);
      
      const batchSize = 500;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach((document) => {
          batch.delete(doc(db, collectionName, document.id));
        });
        
        await batch.commit();
        totalDeleted += batchDocs.length;
        console.log(`✅ Eliminados ${batchDocs.length} documentos de ${collectionName}`);
      }
    }

    console.log(`🎉 Limpieza completa! Total de documentos eliminados: ${totalDeleted}`);
    return true;

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  }
}

export async function createInitialStructures() {
  console.log('🏗️ Creando estructuras iniciales...');
  
  try {
    // No necesitamos crear documentos, solo las collections se crearán automáticamente
    // cuando agregemos el primer documento a cada una
    
    console.log('✅ Estructuras iniciales listas');
    console.log('📝 Las collections se crearán automáticamente al agregar datos');
    
    return true;
  } catch (error) {
    console.error('❌ Error creando estructuras:', error);
    throw error;
  }
}

// Función para crear datos de prueba
export async function createTestData() {
  console.log('🧪 Creando datos de prueba...');
  
  // Esta función la implementaremos después de la limpieza
  return true;
}

// Función principal que ejecuta todo el proceso
export async function resetDatabaseForP2P() {
  try {
    console.log('🚀 Iniciando reset completo de base de datos para P2P...');
    
    // Paso 1: Limpiar todo
    await cleanDatabase();
    
    // Paso 2: Crear estructuras
    await createInitialStructures();
    
    // Paso 3: Crear datos de prueba (opcional)
    // await createTestData();
    
    console.log('🎉 ¡Reset completo exitoso!');
    console.log('📋 La base de datos está lista para el sistema P2P');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en el reset de base de datos:', error);
    throw error;
  }
}