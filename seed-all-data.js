/**
 * Wanyi 考勤系统 - 完整历史数据初始化脚本
 * 
 * 用法: DATABASE_URL="你的连接串" node seed-all-data.js
 * 
 * 此脚本将所有 localStorage 中的历史数据导入 PostgreSQL 数据库
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:IDEaA2vMomgfblksUNCthJ0PTjSmSBzy@dpg-d833uuvaqgkc73fhlhjg-a/restaurant_finance',
  ssl: { rejectUnauthorized: false }
});

// ========== 完整历史数据（从 localStorage 提取） ==========

const ALL_EMPLOYEES = [
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
  { name: 'Adrian', salary: 1900 },
  // 历史数据中存在但当前不在活跃列表的员工
  { name: 'Armando', salary: 2000, isActive: false },
  { name: 'Damaris', salary: 1850, isActive: false }
];

const SALARY_SETTINGS = {
  perfectBonus: 300,
  onceLateBonus: 200,
  lateDeduct: 50,
  absentDeduct: 300
};

// 当前周考勤数据 (2026-05-18 那一周)
const CURRENT_WEEK_DATA = [{"nombre":"Marlen","tiempos":[{"entrada":"09:06","salida":"17:17","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:10","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:09","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:07","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:20","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:08","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Dulce","tiempos":[{"entrada":"","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:20","salida":"17:08","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:05","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:16","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:16","salida":"17:14","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:12","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Hanny","tiempos":[{"entrada":"","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:08","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:16","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:42","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:11","salida":"17:14","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Angeles","tiempos":[{"entrada":"09:43","salida":"17:18","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:30","salida":"17:10","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:04","salida":"17:04","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:26","salida":"17:17","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"11:24","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:05","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Fernanda","tiempos":[{"entrada":"09:03","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:08","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:09","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:07","salida":"17:17","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"08:59","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:08","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Melissa","tiempos":[{"entrada":"09:03","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:08","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:06","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:04","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:05","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Francisco","tiempos":[{"entrada":"09:10","salida":"17:19","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:20","salida":"17:13","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:09","salida":"17:21","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Priscila","tiempos":[{"entrada":"09:44","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:22","salida":"17:09","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:25","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:38","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:35","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Hilary","tiempos":[{"entrada":"09:02","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:08","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:00","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:05","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"08:58","salida":"17:14","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:03","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Miquel","tiempos":[{"entrada":"09:05","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:10","salida":"17:08","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:16","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:07","salida":"17:17","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"08:58","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:28","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]},{"nombre":"Adrian","tiempos":[{"entrada":"09:22","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:18","salida":"17:11","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:15","salida":"17:15","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:13","salida":"17:16","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:32","salida":"17:14","bloqueadoEntrada":true,"bloqueadoSalida":true},{"entrada":"09:20","salida":"","bloqueadoEntrada":true,"bloqueadoSalida":true}]}];

// 历史考勤记录 - 2026/04/11 那一周
const HISTORY_RECORD_1 = {"id":1772317088754,"fecha":"2026/04/11 16:18","empleados":[{"nombre":"Marlen","tiempos":[{"entrada":"09:08","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:08","salida":"17:23","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:08","salida":"17:21","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:15","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:09","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:06","salida":"17:21","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Dulce","tiempos":[{"entrada":"09:10","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:24","salida":"17:27","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:23","salida":"17:14","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:13","salida":"17:12","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:15","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Hanny","tiempos":[{"entrada":"09:09","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:26","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:14","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:00","salida":"17:14","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:08","salida":"17:12","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"08:56","salida":"17:15","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Angeles","tiempos":[{"entrada":"09:17","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:27","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:59","salida":"17:20","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:21","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:22","salida":"17:21","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Fernanda","tiempos":[{"entrada":"09:00","salida":"17:18","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:27","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:20","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:15","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:09","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Melissa","tiempos":[{"entrada":"09:04","salida":"17:15","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:18","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:18","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:15","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:12","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"08:58","salida":"17:12","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Francisco","tiempos":[{"entrada":"09:14","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:28","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:08","salida":"17:18","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:17","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:12","salida":"17:21","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:09","salida":"17:21","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Priscila","tiempos":[{"entrada":"09:09","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:35","salida":"17:18","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:12","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:21","salida":"17:14","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:38","salida":"17:15","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:21","salida":"17:15","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Hilary","tiempos":[{"entrada":"09:00","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:06","salida":"17:18","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:18","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:14","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:10","salida":"17:13","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"08:58","salida":"17:21","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Miquel","tiempos":[{"entrada":"09:08","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:27","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:20","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:06","salida":"17:16","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false}]},{"nombre":"Adrian","tiempos":[{"entrada":"09:09","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:12","salida":"17:22","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:25","salida":"17:19","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:05","salida":"17:20","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:07","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false},{"entrada":"09:17","salida":"17:17","bloqueadoEntrada":false,"bloqueadoSalida":false}]}]};

// 工资历史记录 - 2026/02/28
const SALARY_HISTORY_1 = {"id":1772319025611,"date":"2026/02/28 16:50","settings":{"perfectBonus":300,"onceLateBonus":200,"lateDeduct":50,"absentDeduct":300},"employees":[{"name":"Armando","weekly":2000,"late":1,"early":0,"absent":1,"detail":"缺勤1天 -300","total":1700},{"name":"Marlen","weekly":2400,"late":3,"early":0,"absent":0,"detail":"迟到3次，超2次-100","total":2300},{"name":"Dulce","weekly":2100,"late":2,"early":0,"absent":1,"detail":"缺勤1天 -300；迟到2次，超1次-50","total":1750},{"name":"Hanny","weekly":1750,"late":0,"early":0,"absent":1,"detail":"缺勤1天 -300","total":1450},{"name":"Angeles","weekly":2100,"late":0,"early":0,"absent":0,"detail":"全勤+300","total":2400},{"name":"Fernanda","weekly":1900,"late":0,"early":0,"absent":0,"detail":"全勤+300","total":2200},{"name":"Damaris","weekly":1850,"late":0,"early":0,"absent":1,"detail":"缺勤1天 -300","total":1550},{"name":"Melissa","weekly":1900,"late":1,"early":0,"absent":0,"detail":"迟到1次+200","total":2100},{"name":"Francisco","weekly":2300,"late":1,"early":0,"absent":0,"detail":"迟到1次+200","total":2500},{"name":"Priscila","weekly":1950,"late":3,"early":0,"absent":1,"detail":"缺勤1天 -300；迟到3次，超2次-100","total":1550},{"name":"Hilary","weekly":1750,"late":0,"early":0,"absent":1,"detail":"缺勤1天 -300","total":1450},{"name":"Miquel","weekly":2100,"late":0,"early":0,"absent":0,"detail":"全勤+300","total":2400}]};

// 欠款记录
const DEBTS_DATA = {"Hilary":{"records":[{"category":"借款","amount":500,"date":"2026/5/9"}]}};

async function main() {
  console.log('🚀 开始初始化 Wanyi 考勤系统完整数据...\n');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // ===== 1. 清理旧数据（可选，注释掉以保留已有数据）=====
    // console.log('🗑️  清理旧数据...');
    // await client.query('DELETE FROM attendance');
    // await client.query('DELETE FROM attendance_history');
    // await client.query('DELETE FROM salary_history');
    // await client.query('DELETE FROM debts');
    // await client.query('DELETE FROM employees');
    
    // ===== 2. 插入员工（含已离职员工）=====
    console.log('👥 插入员工数据...');
    for (const emp of ALL_EMPLOYEES) {
      const result = await client.query(
        `INSERT INTO employees (name, weekly_salary, is_active)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET weekly_salary = $2, is_active = $3
         RETURNING id`,
        [emp.name, emp.salary, emp.isActive !== false]
      );
      console.log(`   ✅ ${emp.name} ($${emp.salary}) -> id=${result.rows[0].id}`);
    }
    
    // ===== 3. 工资设置 =====
    console.log('\n💰 更新工资设置...');
    await client.query(
      `INSERT INTO salary_settings (perfect_bonus, once_late_bonus, late_deduct, absent_deduct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [SALARY_SETTINGS.perfectBonus, SALARY_SETTINGS.onceLateBonus, SALARY_SETTINGS.lateDeduct, SALARY_SETTINGS.absentDeduct]
    );
    console.log(`   ✅ 全勤+$${SALARY_SETTINGS.perfectBonus}, 迟到1次+$${SALARY_SETTINGS.onceLateBonus}, 迟到扣$${SALARY_SETTINGS.lateDeduct}, 缺勤扣$${SALARY_SETTINGS.absentDeduct}`);
    
    // ===== 4. 当前周考勤数据 =====
    console.log('\n📋 插入当前周考勤数据...');
    // 计算当前周的周一日期
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const weekStart = monday.toISOString().split('T')[0];
    console.log(`   📅 当前周起始: ${weekStart}`);
    
    for (const emp of CURRENT_WEEK_DATA) {
      const empResult = await client.query('SELECT id FROM employees WHERE name = $1', [emp.nombre]);
      if (empResult.rows.length === 0) {
        console.log(`   ⚠️ 员工 ${emp.nombre} 不存在，跳过`);
        continue;
      }
      const empId = empResult.rows[0].id;
      
      for (let i = 0; i < emp.tiempos.length; i++) {
        const t = emp.tiempos[i];
        if (t.entrada || t.salida) {
          await client.query(
            `INSERT INTO attendance (employee_id, week_start_date, day_of_week, entrada, salida, bloqueado_entrada, bloqueado_salida)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (employee_id, week_start_date, day_of_week)
             DO UPDATE SET entrada = $4, salida = $5, bloqueado_entrada = $6, bloqueado_salida = $7`,
            [empId, weekStart, i, t.entrada || null, t.salida || null, t.bloqueadoEntrada || false, t.bloqueadoSalida || false]
          );
        }
      }
    }
    console.log(`   ✅ 当前周考勤数据已插入`);
    
    // ===== 5. 历史考勤记录 =====
    console.log('\n📚 插入历史考勤记录...');
    
    // 2026/04/11 那一周 (周一 2026/04/06 到周六 2026/04/11)
    const histWeekStart = '2026-04-06';
    const histWeekEnd = '2026-04-11';
    
    // 检查是否已存在
    const existingHist = await client.query(
      "SELECT id FROM attendance_history WHERE week_start_date = $1",
      [histWeekStart]
    );
    
    if (existingHist.rows.length === 0) {
      await client.query(
        `INSERT INTO attendance_history (week_start_date, week_end_date, data)
         VALUES ($1, $2, $3)`,
        [histWeekStart, histWeekEnd, JSON.stringify(HISTORY_RECORD_1.empleados)]
      );
      console.log(`   ✅ 历史记录 ${HISTORY_RECORD_1.fecha} 已插入`);
    } else {
      console.log(`   ⏭️ 历史记录 ${histWeekStart} 已存在，跳过`);
    }
    
    // ===== 6. 工资历史 =====
    console.log('\n💵 插入工资历史...');
    const salWeekStart = '2026-02-23';
    const salWeekEnd = '2026-02-28';
    
    const existingSal = await client.query(
      "SELECT id FROM salary_history WHERE week_start_date = $1",
      [salWeekStart]
    );
    
    if (existingSal.rows.length === 0) {
      await client.query(
        `INSERT INTO salary_history (week_start_date, week_end_date, data)
         VALUES ($1, $2, $3)`,
        [salWeekStart, salWeekEnd, JSON.stringify(SALARY_HISTORY_1)]
      );
      console.log(`   ✅ 工资历史 ${SALARY_HISTORY_1.date} 已插入 (${SALARY_HISTORY_1.employees.length} 人)`);
    } else {
      console.log(`   ⏭️ 工资历史 ${salWeekStart} 已存在，跳过`);
    }
    
    // ===== 7. 欠款记录 =====
    console.log('\n💳 插入欠款记录...');
    for (const [empName, debtInfo] of Object.entries(DEBTS_DATA)) {
      const empResult = await client.query('SELECT id FROM employees WHERE name = $1', [empName]);
      if (empResult.rows.length === 0) continue;
      const empId = empResult.rows[0].id;
      
      for (const record of debtInfo.records) {
        // 检查是否已存在
        const existingDebt = await client.query(
          "SELECT id FROM debts WHERE employee_id = $1 AND amount = $2 AND date = $3",
          [empId, record.amount, record.date]
        );
        
        if (existingDebt.rows.length === 0) {
          await client.query(
            `INSERT INTO debts (employee_id, category, amount, date, note)
             VALUES ($1, $2, $3, $4, $5)`,
            [empId, record.category, record.amount, record.date, record.note || null]
          );
          console.log(`   ✅ ${empName}: ${record.category} $${record.amount} (${record.date})`);
        } else {
          console.log(`   ⏭️ ${empName} 欠款记录已存在`);
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n========================================');
    console.log('✅ 所有数据初始化完成！');
    console.log('========================================');
    console.log('\n📊 数据汇总:');
    console.log(`   👥 员工: ${ALL_EMPLOYEES.length} 人`);
    console.log(`   📋 当前周考勤: 已插入`);
    console.log(`   📚 历史考勤: 1 条`);
    console.log(`   💵 工资历史: 1 条 (${SALARY_HISTORY_1.employees.length} 人)`);
    console.log(`   💳 欠款: Hilary $500`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ 初始化失败:', err);
    throw err;
  } finally {
    client.release();
  }
  
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
