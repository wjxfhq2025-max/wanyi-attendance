const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// 获取工资设置
router.get('/salary', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM salary_settings ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      // 返回默认值
      res.json({
        perfectBonus: 300,
        onceLateBonus: 200,
        lateDeduct: 50,
        absentDeduct: 300
      });
    } else {
      const row = result.rows[0];
      res.json({
        perfectBonus: row.perfect_bonus,
        onceLateBonus: row.once_late_bonus,
        lateDeduct: row.late_deduct,
        absentDeduct: row.absent_deduct
      });
    }
  } catch (err) {
    console.error('获取工资设置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新工资设置
router.put('/salary', async (req, res) => {
  try {
    const { perfectBonus, onceLateBonus, lateDeduct, absentDeduct } = req.body;

    const result = await pool.query(
      `INSERT INTO salary_settings (perfect_bonus, once_late_bonus, late_deduct, absent_deduct)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [perfectBonus, onceLateBonus, lateDeduct, absentDeduct]
    );

    res.json({
      perfectBonus: result.rows[0].perfect_bonus,
      onceLateBonus: result.rows[0].once_late_bonus,
      lateDeduct: result.rows[0].late_deduct,
      absentDeduct: result.rows[0].absent_deduct
    });
  } catch (err) {
    console.error('更新工资设置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
