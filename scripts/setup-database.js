// scripts/setup-database.js - Script para ejecutar el schema SQL
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear pool directamente sin warmup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function setupDatabase() {
  let client;
  try {
    console.log('📖 Leyendo archivo schema.sql...');
    const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
    let schemaSQL = readFileSync(schemaPath, 'utf-8');

    console.log('🔌 Conectando a la base de datos...');
    
    // Probar conexión
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log('✅ Conexión establecida!\n');
    client.release();

    // Limpiar comentarios de línea (-- comentario)
    schemaSQL = schemaSQL.replace(/--.*$/gm, '');
    
    // Dividir el SQL en statements más inteligentemente
    // Manejar bloques de funciones ($$ ... $$)
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    let functionDelimiter = '';
    
    const lines = schemaSQL.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detectar inicio de función
      if (trimmed.includes('$$') && !inFunction) {
        inFunction = true;
        functionDelimiter = trimmed.match(/\$\$[^\$]*\$\$/)?.[0] || '$$';
        currentStatement += line + '\n';
        continue;
      }
      
      // Detectar fin de función
      if (inFunction && trimmed.includes(functionDelimiter)) {
        currentStatement += line;
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
        inFunction = false;
        functionDelimiter = '';
        continue;
      }
      
      if (inFunction) {
        currentStatement += line + '\n';
        continue;
      }
      
      // Statements normales
      if (trimmed && !trimmed.startsWith('COMMENT')) {
        currentStatement += line + '\n';
        
        if (trimmed.endsWith(';')) {
          const clean = currentStatement.trim();
          if (clean.length > 5) {
            statements.push(clean);
          }
          currentStatement = '';
        }
      }
    }

    // Agregar último statement si existe
    if (currentStatement.trim().length > 5) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Ejecutando ${statements.length} statements...\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      if (statement.length < 5 || statement === ';') {
        continue;
      }

      try {
        client = await pool.connect();
        await client.query(statement);
        client.release();
        successCount++;
        if (successCount % 3 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        if (client) client.release();
        
        // Ignorar errores de "ya existe" (IF NOT EXISTS)
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            (errorMsg.includes('relation') && errorMsg.includes('already')) ||
            errorMsg.includes('does not exist')) {
          successCount++;
          continue;
        }
        
        errorCount++;
        const statementPreview = statement.substring(0, 100).replace(/\n/g, ' ');
        errors.push({
          index: i + 1,
          statement: statementPreview,
          error: error.message
        });
      }
    }

    console.log('\n\n✅ Proceso completado!');
    console.log(`   ✓ Exitosos: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ✗ Errores: ${errorCount}`);
      console.log('\n⚠️  Primeros errores encontrados:');
      errors.slice(0, 5).forEach(e => {
        console.log(`   [${e.index}] ${e.error}`);
        console.log(`       SQL: ${e.statement}...`);
      });
      if (errors.length > 5) {
        console.log(`   ... y ${errors.length - 5} errores más`);
      }
    } else {
      console.log('\n🎉 Base de datos configurada correctamente!');
      console.log('   Todas las tablas, índices y triggers fueron creados.\n');
    }

    await pool.end();
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    if (!process.env.DATABASE_URL) {
      console.error('\n⚠️  No se encontró DATABASE_URL en las variables de entorno.');
      console.error('   Asegúrate de tener un archivo .env con tu conexión a PostgreSQL.');
    }
    if (client) client.release();
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();

