const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// 获取所有员工
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE is_active = true ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('获取员工列表错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加员工
router.post('/', async (req, res) => {
  try {
    const { name, weekly_salary } = req.body;

    const result = await pool.query(
      `INSERT INTO employees (name, weekly_salary)
       VALUES ($1, $2)
       RETURNING *`,
      [name, weekly_salary || 0]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('添加员工错误:', err);
    if (err.code === '23505') {
      res.status(400).json({ error: '员工姓名已存在' });
    } else {
      res.status(500).json({ error: '服务器错误' });
    }
  }
});

// 更新员工
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, weekly_salary } = req.body;

    const result = await pool.query(
      `UPDATE employees
       SET name = COALESCE($1, name),
           weekly_salary = COALESCE($2, weekly_salary)
       WHERE id = $3
       RETURNING *`,
      [name, weekly_salary, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '员工不存在' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('更新员工错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除员工（软删除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE employees SET is_active = false WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '员工不存在' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('删除员工错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
