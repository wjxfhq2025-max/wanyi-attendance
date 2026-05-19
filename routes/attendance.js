const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// 获取当前周的起止日期（周一到周六）
function getWeekDates(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  return { monday, saturday };
}

// 获取当前周考勤数据
router.get('/current', async (req, res) => {
  try {
    const { monday } = getWeekDates();
    const weekStart = monday.toISOString().split('T')[0];

    // 获取所有员工
    const employeesResult = await pool.query(
      'SELECT id, name FROM employees WHERE is_active = true ORDER BY id'
    );

    // 获取本周考勤
    const attendanceResult = await pool.query(
      `SELECT a.*, e.name as employee_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.week_start_date = $1`,
      [weekStart]
    );

    // 构建返回数据
    const data = employeesResult.rows.map(emp => {
      const times = [];
      for (let i = 0; i < 6; i++) {
        const record = attendanceResult.rows.find(
          a => a.employee_id === emp.id && a.day_of_week === i
        );
        times.push({
          entrada: record?.entrada || '',
          salida: record?.salida || '',
          bloqueadoEntrada: record?.bloqueado_entrada || false,
          bloqueadoSalida: record?.bloqueado_salida || false
        });
      }
      return { nombre: emp.name, tiempos: times };
    });

    res.json({
      weekStart,
      data
    });
  } catch (err) {
    console.error('获取当前周考勤错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 保存考勤记录
router.post('/save', async (req, res) => {
  try {
    const { weekStart, data } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const emp of data) {
        // 获取员工ID
        const empResult = await client.query(
          'SELECT id FROM employees WHERE name = $1',
          [emp.nombre]
        );

        if (empResult.rows.length === 0) continue;
        const empId = empResult.rows[0].id;

        for (let i = 0; i < emp.tiempos.length; i++) {
          const t = emp.tiempos[i];
          await client.query(
            `INSERT INTO attendance (employee_id, week_start_date, day_of_week, entrada, salida, bloqueado_entrada, bloqueado_salida)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (employee_id, week_start_date, day_of_week)
             DO UPDATE SET entrada = $4, salida = $5, bloqueado_entrada = $6, bloqueado_salida = $7`,
            [empId, weekStart, i, t.entrada || null, t.salida || null, t.bloqueadoEntrada, t.bloqueadoSalida]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('保存考勤错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 保存到历史记录
router.post('/save-to-history', async (req, res) => {
  try {
    const { weekStart, weekEnd, data } = req.body;

    await pool.query(
      `INSERT INTO attendance_history (week_start_date, week_end_date, data)
       VALUES ($1, $2, $3)`,
      [weekStart, weekEnd, JSON.stringify(data)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('保存历史记录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取历史记录列表
router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, week_start_date, week_end_date, saved_at
       FROM attendance_history
       ORDER BY saved_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('获取历史记录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取历史记录详情
router.get('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM attendance_history WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取历史记录详情错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
