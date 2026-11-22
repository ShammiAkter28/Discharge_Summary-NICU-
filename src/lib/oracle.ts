import oracledb from "oracledb";

/**
 * Global pool reference to prevent multiple pool instances during Next.js Hot Module Replacement (HMR).
 */
declare global {
  // eslint-disable-next-line no-var
  var __oraclePool: oracledb.Pool | undefined;
}

// Oracle Thin Mode is enabled by default in oracledb v6+
// (No need for Oracle Client binary/instant client installation)

const poolConfig: oracledb.PoolAttributes = {
  user: process.env.ORACLE_USER || "ATI_REGI",
  password: process.env.ORACLE_PASSWORD || "ATI_REGI",
  connectString:
    process.env.ORACLE_CONNECT_STRING ||
    `${process.env.ORACLE_HOST || "192.168.0.246"}:${
      process.env.ORACLE_PORT || "1521"
    }/${process.env.ORACLE_SERVICE_NAME || "ORCL"}`,
  poolMin: Number(process.env.ORACLE_POOL_MIN) || 1,
  poolMax: Number(process.env.ORACLE_POOL_MAX) || 10,
  poolIncrement: Number(process.env.ORACLE_POOL_INCREMENT) || 1,
  poolTimeout: Number(process.env.ORACLE_POOL_TIMEOUT) || 60,
  poolAlias: "EMR_DISCHARGE_POOL",
};

/**
 * Initializes or retrieves the existing Oracle connection pool.
 */
export async function getOraclePool(): Promise<oracledb.Pool> {
  if (globalThis.__oraclePool) {
    return globalThis.__oraclePool;
  }

  try {
    // Check if an existing pool with the alias exists in the oracledb runtime
    const existing = oracledb.getPool(poolConfig.poolAlias);
    if (existing) {
      globalThis.__oraclePool = existing;
      return existing;
    }
  } catch {
    // Pool doesn't exist yet; proceed to create it below
  }

  try {
    const pool = await oracledb.createPool(poolConfig);
    globalThis.__oraclePool = pool;
    console.log(" Oracle Connection Pool created successfully:", {
      user: poolConfig.user,
      connectString: poolConfig.connectString,
      poolMax: poolConfig.poolMax,
    });
    return pool;
  } catch (error) {
    console.error(" Failed to initialize Oracle Connection Pool:", error);
    throw error;
  }
}

/**
 * Safely executes a SQL query using parameterized bind variables to prevent SQL injection.
 * Automatically acquires and releases a connection from the pool.
 *
 * @param sql - The SQL statement with named or positional bind parameters (e.g., :admission_id, :status)
 * @param binds - Object or Array containing bind values { admission_id: 'AD1002' }
 * @param options - Optional oracledb execution options (e.g. autoCommit: true)
 */
export async function executeOracleQuery<T = any>(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T>> {
  const pool = await getOraclePool();
  let connection: oracledb.Connection | null = null;

  try {
    connection = await pool.getConnection();

    // Default to OUT_FORMAT_OBJECT so columns are mapped to object keys
    const executeOptions: oracledb.ExecuteOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false,
      ...options,
    };

    const result = await connection.execute<T>(sql, binds, executeOptions);
    return result;
  } catch (error) {
    console.error(" Oracle query execution failed:", { sql, binds, error });
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error(" Error closing Oracle connection:", closeErr);
      }
    }
  }
}

/**
 * Verifies connectivity to the database and returns diagnostics.
 */
export async function testOracleHealth() {
  try {
    const result = await executeOracleQuery<{
      BANNER: string;
      CURRENT_TIME: string;
      DB_USER: string;
    }>(
      `SELECT 
        (SELECT BANNER FROM V$VERSION WHERE ROWNUM = 1) AS BANNER,
        TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS CURRENT_TIME,
        USER AS DB_USER
       FROM DUAL`
    );

    return {
      connected: true,
      data: result.rows?.[0] || null,
      error: null,
    };
  } catch (err: any) {
    return {
      connected: false,
      data: null,
      error: err.message || "Failed to reach Oracle Database",
    };
  }
}

/**
 * Closes the connection pool gracefully (useful during server shutdown).
 */
export async function closeOraclePool(): Promise<void> {
  if (globalThis.__oraclePool) {
    try {
      await globalThis.__oraclePool.close(10);
      globalThis.__oraclePool = undefined;
      console.log("🔌 Oracle Connection Pool closed.");
    } catch (err) {
      console.error("Error closing Oracle connection pool:", err);
    }
  }
}
