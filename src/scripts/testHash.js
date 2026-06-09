const bcrypt = require('bcrypt');
const hash = '$2b$10$q4w48NQPbCN1ZpECXQ9c5edjlkp6eh42PNedEENt9P2OQ3RC7FIf2';
bcrypt.compare('admin123', hash).then(res => console.log('Match:', res));
