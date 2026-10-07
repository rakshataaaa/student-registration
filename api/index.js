const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create a database connection pool using environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false } // Required for many cloud MySQL providers
});

// Helper: Ensure the students table exists
async function initDB() {
    try {
        const connection = await pool.getConnection();
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                course VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        connection.release();
    } catch (err) {
        console.error('Database initialization error:', err.message);
    }
}
initDB();

// GET /api/students -> Get all students
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM students ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/students -> Add a student
app.post('/api/students', async (req, res) => {
    try {
        const { name, email, phone, course } = req.body;
        if (!name || !email || !phone || !course) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const query = 'INSERT INTO students (name, email, phone, course) VALUES (?, ?, ?, ?)';
        const [result] = await pool.execute(query, [name, email, phone, course]);
        
        res.status(201).json({ 
            message: 'Student registered successfully!', 
            studentId: result.insertId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/students/:id -> Update a student
app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, course } = req.body;

        if (!name || !email || !phone || !course) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const query = 'UPDATE students SET name = ?, email = ?, phone = ?, course = ? WHERE id = ?';
        const [result] = await pool.execute(query, [name, email, phone, course, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        res.json({ message: 'Student updated successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/students/:id -> Delete a student
app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM students WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        res.json({ message: 'Student deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// For local development testing
// For local development testing
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000; // Force port 3000 for local website testing
    app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
    });
}
// Export for Vercel Serverless Functions
module.exports = app;