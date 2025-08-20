// src/utils/migrationHelper.js
// Utility para ejecutar migraciones de base de datos durante desarrollo

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

class MigrationHelper {
  constructor() {
    // Funciones de migración
    this.migrateUsers = httpsCallable(functions, 'migrateUsers');
    this.migrateListings = httpsCallable(functions, 'migrateListings');
    this.migrateTransactions = httpsCallable(functions, 'migrateTransactions');
    this.checkMigrationStatus = httpsCallable(functions, 'checkMigrationStatus');
    
    // Funciones de población de datos
    this.seedStores = httpsCallable(functions, 'seedStores');
    this.createEmptyCollections = httpsCallable(functions, 'createEmptyCollections');
    this.verifyCollections = httpsCallable(functions, 'verifyCollections');
  }

  // Ejecutar migración de usuarios
  async runUsersMigration() {
    console.log('🔄 Iniciando migración de usuarios...');
    try {
      const result = await this.migrateUsers();
      console.log('✅ Migración de usuarios completada:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error en migración de usuarios:', error);
      throw error;
    }
  }

  // Ejecutar migración de listings
  async runListingsMigration() {
    console.log('🔄 Iniciando migración de listings...');
    try {
      const result = await this.migrateListings();
      console.log('✅ Migración de listings completada:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error en migración de listings:', error);
      throw error;
    }
  }

  // Ejecutar migración de transacciones (con backup automático)
  async runTransactionsMigration() {
    console.log('🔄 Iniciando migración de transactions...');
    console.log('⚠️  ADVERTENCIA: Se creará backup automático antes de migrar');
    try {
      const result = await this.migrateTransactions();
      console.log('✅ Migración de transactions completada:', result.data);
      console.log(`📦 Backup guardado en: ${result.data.backupCollection}`);
      return result.data;
    } catch (error) {
      console.error('❌ Error en migración de transactions:', error);
      throw error;
    }
  }

  // Verificar estado de todas las migraciones
  async checkStatus() {
    console.log('🔍 Verificando estado de migraciones...');
    try {
      const result = await this.checkMigrationStatus();
      console.log('📊 Estado de migraciones:', result.data);
      
      const { users, listings, transactions } = result.data;
      
      console.log('\n📋 RESUMEN:');
      console.log(`👥 Users: ${users.migrated ? '✅ Migrado' : '❌ Pendiente'} (${users.total} total)`);
      console.log(`📦 Listings: ${listings.migrated ? '✅ Migrado' : '❌ Pendiente'} (${listings.total} total)`);
      console.log(`🔄 Transactions: ${transactions.migrated ? '✅ Migrado' : '❌ Pendiente'} (${transactions.total} total)`);
      
      return result.data;
    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      throw error;
    }
  }

  // Poblar tiendas con datos iniciales
  async seedStoresData() {
    console.log('🏪 Poblando tiendas con datos iniciales...');
    try {
      const result = await this.seedStores();
      console.log('✅ Población de tiendas completada:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error poblando tiendas:', error);
      throw error;
    }
  }

  // Crear colecciones vacías
  async createCollections() {
    console.log('📁 Creando colecciones P2P...');
    try {
      const result = await this.createEmptyCollections();
      console.log('✅ Colecciones P2P creadas:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creando colecciones:', error);
      throw error;
    }
  }

  // Verificar todas las colecciones
  async verifyAllCollections() {
    console.log('🔍 Verificando todas las colecciones...');
    try {
      const result = await this.verifyCollections();
      console.log('📊 Estado de colecciones:', result.data);
      
      const { collections, summary } = result.data;
      
      console.log('\n📋 RESUMEN DE COLECCIONES:');
      console.log(`📁 Total: ${summary.total}`);
      console.log(`✅ Con documentos: ${summary.existing}`);
      console.log(`📂 Vacías: ${summary.empty}`);
      
      collections.forEach(col => {
        const icon = col.exists ? '✅' : '📂';
        console.log(`${icon} ${col.collection}: ${col.status}`);
      });
      
      return result.data;
    } catch (error) {
      console.error('❌ Error verificando colecciones:', error);
      throw error;
    }
  }

  // Ejecutar todas las migraciones y configuración inicial
  async runCompleteSetup() {
    console.log('🚀 Iniciando configuración completa del sistema P2P...\n');
    
    try {
      // 1. Crear colecciones vacías primero
      console.log('=== PASO 1: CREAR COLECCIONES ===');
      await this.createCollections();
      console.log('');
      
      // 2. Poblar tiendas
      console.log('=== PASO 2: POBLAR TIENDAS ===');
      await this.seedStoresData();
      console.log('');
      
      // 3. Migrar usuarios
      console.log('=== PASO 3: MIGRAR USUARIOS ===');
      await this.runUsersMigration();
      console.log('');
      
      // 4. Migrar listings
      console.log('=== PASO 4: MIGRAR LISTINGS ===');
      await this.runListingsMigration();
      console.log('');
      
      // 5. Migrar transactions (más complejo, con backup)
      console.log('=== PASO 5: MIGRAR TRANSACTIONS ===');
      await this.runTransactionsMigration();
      console.log('');
      
      // 6. Verificación final
      console.log('=== PASO 6: VERIFICACIÓN FINAL ===');
      await this.verifyAllCollections();
      console.log('');
      
      // 7. Verificar migraciones específicas
      await this.checkStatus();
      
      console.log('\n🎉 ¡CONFIGURACIÓN COMPLETA EXITOSA!');
      console.log('✨ El sistema está completamente listo para el flujo P2P');
      console.log('🏪 12 tiendas configuradas en Costa Rica');
      console.log('📁 Todas las colecciones P2P creadas');
      console.log('🔄 Migraciones completadas');
      
      return { success: true, message: 'Configuración completa del sistema P2P exitosa' };
      
    } catch (error) {
      console.error('\n💥 ERROR EN CONFIGURACIÓN COMPLETA:', error);
      console.log('⚠️  Se recomienda verificar el estado y corregir errores antes de continuar');
      throw error;
    }
  }

  // Ejecutar todas las migraciones en secuencia (función original)
  async runAllMigrations() {
    console.log('🚀 Iniciando migración completa del sistema...\n');
    
    try {
      // 1. Migrar usuarios primero
      await this.runUsersMigration();
      console.log('');
      
      // 2. Migrar listings
      await this.runListingsMigration();
      console.log('');
      
      // 3. Migrar transactions (más complejo, con backup)
      await this.runTransactionsMigration();
      console.log('');
      
      // 4. Verificar que todo esté correcto
      await this.checkStatus();
      
      console.log('\n🎉 ¡MIGRACIÓN COMPLETA EXITOSA!');
      console.log('✨ El sistema está listo para el flujo P2P');
      
      return { success: true, message: 'Todas las migraciones completadas exitosamente' };
      
    } catch (error) {
      console.error('\n💥 ERROR EN MIGRACIÓN COMPLETA:', error);
      console.log('⚠️  Se recomienda verificar el estado y corregir errores antes de continuar');
      throw error;
    }
  }
}

// Instancia singleton para usar en la aplicación
const migrationHelper = new MigrationHelper();

export default migrationHelper;

// También exportar para uso directo en consola de desarrollo
export { MigrationHelper };

// Funciones de conveniencia para consola del navegador
if (typeof window !== 'undefined') {
  window.migrationHelper = migrationHelper;
  console.log('🔧 MigrationHelper disponible en window.migrationHelper');
  console.log('💡 Comandos principales:');
  console.log('   🚀 window.migrationHelper.runCompleteSetup() - Configuración completa P2P');
  console.log('   📊 window.migrationHelper.verifyAllCollections() - Verificar todas las colecciones');
  console.log('   🔍 window.migrationHelper.checkStatus() - Estado de migraciones');
  console.log('');
  console.log('💡 Comandos individuales:');
  console.log('   👥 window.migrationHelper.runUsersMigration()');
  console.log('   📦 window.migrationHelper.runListingsMigration()');
  console.log('   🔄 window.migrationHelper.runTransactionsMigration()');
  console.log('   🏪 window.migrationHelper.seedStoresData()');
  console.log('   📁 window.migrationHelper.createCollections()');
}