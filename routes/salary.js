const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// 获取工资历史
router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, week_start_date, week_end_date, calculated_at, data
       FROM salary_history
       ORDER BY calculated_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('获取工资历史错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 保存工资记录
router.post('/save', async (req, res) => {
  try {
    const { weekStart, weekEnd, data } = req.body;

    await pool.query(
      `INSERT INTO salary_history (week_start_date, week_end_date, data)
       VALUES ($1, $2, $3)`,
      [weekStart, weekEnd, JSON.stringify(data)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('保存工资记录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 计算工资详情
router.post('/calculate', async (req, res) => {
  try {
    const { employeeName, attendanceData, settings } = req.body;

    // 获取员工周薪
    const empResult = await pool.query(
      'SELECT weekly_salary FROM employees WHERE name = $1',
      [employeeName]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: '员工不存在' });
    }

    const weeklySalary = empResult.rows[0].weekly_salary;
    let lateCount = 0;
    let absentCount = 0;
    let earlyLeaveCount = 0;

    // 统计迟到、缺勤
    for (const t of attendanceData) {
      if (!t.entrada) {
        absentCount++;
      } else {
        const entradaHour = parseInt(t.entrada.split(':')[0]);
        const entradaMin = parseInt(t.entrada.split(':')[1]);
        if (entradaHour > 9 || (entradaHour === 9 && entradaMin > 0)) {
          lateCount++;
        }
      }
      // 早退检测
      if (t.salida) {
        const salidaHour = parseInt(t.salida.split(':')[0]);
        if (salidaHour < 17) {
          earlyLeaveCount++;
        }
      }
    }

    // 计算奖金/扣款
    let total = weeklySalary;
    let detail = '';

    if (lateCount === 0 && absentCount === 0) {
      total += settings.perfectBonus;
      detail = `全勤+${settings.perfectBonus}`;
    } else if (lateCount === 1 && absentCount === 0) {
      total += settings.onceLateBonus;
      detail = `迟到1次+${settings.onceLateBonus}`;
    } else {
      if (absentCount > 0) {
        total -= absentCount * settings.absentDeduct;
        detail = `缺勤${absentCount}天 -${absentCount * settings.absentDeduct}`;
      }
      if (lateCount > 1) {
        const lateDeduct = (lateCount - 1) * settings.lateDeduct;
        total -= lateDeduct;
        detail += (detail ? '；' : '') + `迟到${lateCount}次，超${lateCount - 1}次-${lateDeduct}`;
      }
    }

    res.json({
      name: employeeName,
      weekly: weeklySalary,
      late: lateCount,
      early: earlyLeaveCount,
      absent: absentCount,
      detail,
      total
    });
  } catch (err) {
    console.error('计算工资错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
