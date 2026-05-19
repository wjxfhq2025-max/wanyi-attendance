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
