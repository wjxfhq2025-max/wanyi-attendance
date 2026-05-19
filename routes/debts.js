const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// 获取所有欠款记录
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, e.name as employee_name
       FROM debts d
       JOIN employees e ON d.employee_id = e.id
       ORDER BY d.date DESC`
    );

    // 按员工分组
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.employee_name]) {
        grouped[row.employee_name] = { records: [] };
      }
      grouped[row.employee_name].records.push({
        category: row.category,
        amount: row.amount,
        date: row.date,
        note: row.note
      });
    }

    res.json(grouped);
  } catch (err) {
    console.error('获取欠款记录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加欠款记录
router.post('/', async (req, res) => {
  try {
    const { employeeName, category, amount, date, note } = req.body;

    // 获取员工ID
    const empResult = await pool.query(
      'SELECT id FROM employees WHERE name = $1',
      [employeeName]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: '员工不存在' });
    }

    const empId = empResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO debts (employee_id, category, amount, date, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [empId, category, amount, date, note || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('添加欠款记录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除欠款记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM debts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('删除欠款记录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
