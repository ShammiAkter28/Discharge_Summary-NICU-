/**
 * Oracle Database Connection Test Script
 * Run with: npm run test:db
 */

const fs = require('fs');
const path = require('path');

// Manually load .env.local if not loaded
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const oracledb = require('oracledb');

async function testConnection() {
  console.log('----------------------------------------------------');
  console.log('🩺 Testing Oracle Database Connection for Inpatient EMR');
  console.log('----------------------------------------------------');

  const user = process.env.ORACLE_USER || 'ATI_REGI';
  const password = process.env.ORACLE_PASSWORD || 'ATI_REGI';
  const connectString = process.env.ORACLE_CONNECT_STRING || '192.168.0.246:1521/ORCL';

  console.log(`📡 Target Host/Service: ${connectString}`);
  console.log(`👤 Database User      : ${user}`);
  console.log(`⚙️ Oracle Thin Mode    : ${oracledb.thin ? 'Enabled (pure JS)' : 'Thick (C driver)'}`);

  let connection;
  try {
    console.log('\n⏳ Attempting connection...');
    connection = await oracledb.getConnection({
      user,
      password,
      connectString,
    });

    console.log('✅ Connection established successfully!\n');

    // 1. Check Database Version
    const verResult = await connection.execute(
      `SELECT BANNER FROM V$VERSION WHERE ROWNUM = 1`
    );
    console.log(`🏛️ Oracle Version: ${verResult.rows ? verResult.rows[0][0] : 'N/A'}`);

    // 2. Check Current User & System Date
    const sysResult = await connection.execute(
      `SELECT USER, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS CURRENT_TIME, SYS_CONTEXT('USERENV', 'DB_NAME') AS DB_NAME FROM DUAL`
    );
    console.log(`🕒 Database Time : ${sysResult.rows ? sysResult.rows[0][1] : 'N/A'}`);
    console.log(`📁 Database Name : ${sysResult.rows ? sysResult.rows[0][2] : 'N/A'}`);

    // 3. Check for existing Discharge / Patient tables if any
    console.log('\n🔍 Scanning for relevant tables in ATI_REGI schema...');
    const tableResult = await connection.execute(
      `SELECT TABLE_NAME FROM USER_TABLES WHERE TABLE_NAME LIKE '%PATIENT%' OR TABLE_NAME LIKE '%DISCHARGE%' OR TABLE_NAME LIKE '%EMR%' ORDER BY TABLE_NAME`
    );

    if (tableResult.rows && tableResult.rows.length > 0) {
      console.log('Found tables:');
      tableResult.rows.forEach(r => console.log(`   - ${r[0]}`));
    } else {
      console.log('No specific discharge summary table found. API is configured with fallback mock & safe Oracle table schema creation.');
    }

    console.log('\n🎉 Oracle Database connectivity test PASSED completely!');
  } catch (err) {
    console.error('\n❌ Oracle Connection Error:', err.message);
    if (err.message.includes('ORA-12541') || err.message.includes('ORA-12170')) {
      console.error('💡 Hint: TNS listener issue or firewall blocking port 1521.');
    } else if (err.message.includes('ORA-01017')) {
      console.error('💡 Hint: Invalid username/password.');
    } else if (err.message.includes('ORA-12514')) {
      console.error('💡 Hint: Service ORCL not recognized by listener. Try SID=ORCL.');
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔌 Connection closed properly.');
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

testConnection();
