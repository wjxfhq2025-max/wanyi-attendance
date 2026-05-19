const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('PostgreSQL 连接池错误:', err.message);
});

// 兼容接口
async function get(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : undefined;
}

async function all(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function run(sql, params = []) {
  const result = await pool.query(sql, params);
  return {
    lastInsertRowid: result.rowCount > 0 ? (result.rows[0]?.id || 0) : 0,
    changes: result.rowCount
  };
}

async function runAndGetId(sql, params = []) {
  const returnSql = sql.trim().endsWith(';')
    ? sql.slice(0, -1) + ' RETURNING id'
    : sql + ' RETURNING id';
  const result = await pool.query(returnSql, params);
  return {
    lastInsertRowid: result.rows.length > 0 ? result.rows[0].id : 0,
    changes: result.rowCount
  };
}

// 创建表
async function createTablesInternal(client) {
  const queries = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      real_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 员工表
    `CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      weekly_salary REAL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 考勤记录表
    `CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      week_start_date DATE NOT NULL,
      day_of_week INTEGER NOT NULL,
      entrada TIME,
      salida TIME,
      bloqueado_entrada BOOLEAN DEFAULT false,
      bloqueado_salida BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, week_start_date, day_of_week)
    )`,

    // 历史周记录表
    `CREATE TABLE IF NOT EXISTS attendance_history (
      id SERIAL PRIMARY KEY,
      week_start_date DATE NOT NULL,
      week_end_date DATE NOT NULL,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data JSONB NOT NULL
    )`,

    // 工资设置表
    `CREATE TABLE IF NOT EXISTS salary_settings (
      id SERIAL PRIMARY KEY,
      perfect_bonus REAL DEFAULT 300,
      once_late_bonus REAL DEFAULT 200,
      late_deduct REAL DEFAULT 50,
      absent_deduct REAL DEFAULT 300,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 工资历史表
    `CREATE TABLE IF NOT EXISTS salary_history (
      id SERIAL PRIMARY KEY,
      week_start_date DATE NOT NULL,
      week_end_date DATE NOT NULL,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data JSONB NOT NULL
    )`,

    // 欠款记录表
    `CREATE TABLE IF NOT EXISTS debts (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Session 表
    `CREATE TABLE IF NOT EXISTS "session" (
      sid VARCHAR NOT NULL COLLATE "default",
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL,
      PRIMARY KEY (sid)
    )`
  ];

  for (const sql of queries) {
    await (client || pool).query(sql);
  }
}

// 插入默认数据
async function seedDefaultDataInternal(client) {
  const q = client || pool;

  // 默认管理员
  const adminPassword = await bcrypt.hash('admin123', 10);
  await q.query(
    `INSERT INTO users (username, password, role, real_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO UPDATE SET password = $2`,
    ['admin', adminPassword, 'admin', '管理员']
  );
  console.log('  ✅ 管理员账号: admin / admin123');

  // 默认员工列表
  const employees = [
    { name: 'Marlen', salary: 2400 },
    { name: 'Dulce', salary: 2100 },
    { name: 'Hanny', salary: 1750 },
    { name: 'Angeles', salary: 2100 },
    { name: 'Fernanda', salary: 1900 },
    { name: 'Melissa', salary: 1900 },
    { name: 'Francisco', salary: 2300 },
    { name: 'Priscila', salary: 1950 },
    { name: 'Hilary', salary: 1750 },
    { name: 'Miquel', salary: 2100 },
    { name: 'Adrian', salary: 1900 }
  ];

  for (const emp of employees) {
    await q.query(
      `INSERT INTO employees (name, weekly_salary)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET weekly_salary = $2`,
      [emp.name, emp.salary]
    );
  }
  console.log(`  ✅ 默认员工已创建（共 ${employees.length} 人）`);

  // 默认工资设置
  await q.query(
    `INSERT INTO salary_settings (perfect_bonus, once_late_bonus, late_deduct, absent_deduct)
     VALUES (300, 200, 50, 300)
     ON CONFLICT DO NOTHING`
  );
  console.log('  ✅ 默认工资设置已创建');

  // Hilary 的欠款记录
  const hilaryResult = await q.query(`SELECT id FROM employees WHERE name = 'Hilary'`);
  if (hilaryResult.rows.length > 0) {
    const hilaryId = hilaryResult.rows[0].id;
    await q.query(
      `INSERT INTO debts (employee_id, category, amount, date)
       VALUES ($1, '借款', 500, '2026/5/9')
       ON CONFLICT DO NOTHING`,
      [hilaryId]
    );
    console.log('  ✅ Hilary 欠款记录已创建');
  }
}

// 初始化数据库
async function initDatabase() {
  console.log('📊 初始化数据库 (PostgreSQL)...');
  console.log('DATABASE_URL 是否设置:', !!process.env.DATABASE_URL);

  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`🔄 第 ${attempt}/5 次尝试连接数据库...`);

      const result = await pool.query('SELECT NOW() as now');
      console.log('✅ PostgreSQL 连接成功:', result.rows[0].now);

      await createTablesInternal();
      console.log('✅ 数据库表已确保存在');

      await seedDefaultDataInternal();

      console.log('✅ 数据库初始化成功');
      return { get, all, run, runAndGetId };
    } catch (err) {
      lastError = err;
      console.error(`❌ 第 ${attempt} 次尝试失败:`, err.message);
      if (attempt < 5) {
        console.log(`⏳ 等待 ${attempt * 2} 秒后重试...`);
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }

  console.error('❌ 数据库初始化失败（已重试5次）:', lastError.message);
  throw lastError;
}

module.exports = { pool, initDatabase, get, all, run, runAndGetId };
