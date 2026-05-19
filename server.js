const express = require('express');
const session = require('express-session');
const pgStore = require('connect-pg-simple')(session);
const path = require('path');
const { pool, initDatabase } = require('./database');
const config = require('./config');

const app = express();
const PORT = config.port;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new pgStore({
    pool,
    tableName: 'session'
  }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/debts', require('./routes/debts'));
app.use('/api/settings', require('./routes/settings'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ===== 一次性数据初始化端点（用于导入历史数据）=====
app.post('/api/init-seed-data', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || process.env.SEED_DONE === 'true') {
      return res.json({ message: 'Seed already done or no data', status: 'skipped' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = { employees: 0, attendance: 0, history: 0, salaryHistory: 0, debts: 0 };
      
      // 员工
      if (data.employees) {
        for (const emp of data.employees) {
          await client.query(
            `INSERT INTO employees (name, weekly_salary, is_active)
             VALUES ($1, $2, $3)
             ON CONFLICT (name) DO UPDATE SET weekly_salary = $2, is_active = $3`,
            [emp.name, emp.salary, emp.isActive !== false]
          );
          results.employees++;
        }
      }
      
      // 工资设置
      if (data.salarySettings) {
        const s = data.salarySettings;
        await client.query(
          `INSERT INTO salary_settings (perfect_bonus, once_late_bonus, late_deduct, absent_deduct)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [s.perfectBonus, s.onceLateBonus, s.lateDeduct, s.absentDeduct]
        );
      }
      
      // 当前周考勤
      if (data.currentWeekAttendance && data.weekStart) {
        for (const emp of data.currentWeekAttendance) {
          const empRes = await client.query('SELECT id FROM employees WHERE name = $1', [emp.nombre]);
          if (empRes.rows.length === 0) continue;
          const empId = empRes.rows[0].id;
          for (let i = 0; i < emp.tiempos.length; i++) {
            const t = emp.tiempos[i];
            if (t.entrada || t.salida) {
              await client.query(
                `INSERT INTO attendance (employee_id, week_start_date, day_of_week, entrada, salida, bloqueado_entrada, bloqueado_salida)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)
                 ON CONFLICT (employee_id,week_start_date,day_of_week)
                 DO UPDATE SET entrada=$4,salida=$5,bloqueado_entrada=$6,bloqueado_salida=$7`,
                [empId, data.weekStart, i, t.entrada||null, t.salida||null, t.bloqueadoEntrada||false, t.bloqueadoSalida||false]
              );
              results.attendance++;
            }
          }
        }
      }
      
      // 历史考勤记录
      if (data.attendanceHistory) {
        for (const h of data.attendanceHistory) {
          const existing = await client.query('SELECT id FROM attendance_history WHERE week_start_date=$1',[h.weekStart]);
          if (existing.rows.length===0) {
            await client.query(
              `INSERT INTO attendance_history (week_start_date, week_end_date, data) VALUES ($1,$2,$3)`,
              [h.weekStart, h.weekEnd, JSON.stringify(h.data)]
            );
            results.history++;
          }
        }
      }
      
      // 工资历史
      if (data.salaryHistory) {
        for (const h of data.salaryHistory) {
          const existing = await client.query('SELECT id FROM salary_history WHERE week_start_date=$1',[h.weekStart]);
          if (existing.rows.length===0) {
            await client.query(
              `INSERT INTO salary_history (week_start_date, week_end_date, data) VALUES ($1,$2,$3)`,
              [h.weekStart, h.weekEnd, JSON.stringify(h.data)]
            );
            results.salaryHistory++;
          }
        }
      }
      
      // 欠款
      if (data.debts) {
        for (const [empName, debtInfo] of Object.entries(data.debts)) {
          const empRes = await client.query('SELECT id FROM employees WHERE name=$1',[empName]);
          if (empRes.rows.length===0) continue;
          const empId = empRes.rows[0].id;
          for (const r of debtInfo.records) {
            const existing = await client.query('SELECT id FROM debts WHERE employee_id=$1 AND amount=$2 AND date=$3',[empId,r.amount,r.date]);
            if (existing.rows.length===0) {
              await client.query(`INSERT INTO debts (employee_id,category,amount,date,note) VALUES ($1,$2,$3,$4,$5)`,
                [empId, r.category, r.amount, r.date, r.note||null]);
              results.debts++;
            }
          }
        }
      }
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'Seed data imported successfully', results });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

// Start
async function start() {
  try {
    await initDatabase();
    console.log('✅ 数据库初始化完成');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('📋 Wanyi 员工考勤 + 工资卡管理系统');
      console.log(`   访问地址: http://localhost:${PORT}`);
      console.log('');
    });
  } catch (err) {
    console.error('❌ 启动失败:', err.message);
    process.exit(1);
  }
}

start();
