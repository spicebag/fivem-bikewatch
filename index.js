const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const ejs = require('ejs');
const cookieParser = require('cookie-parser');

const app = express();
const secretKey = 'your-secret-key'; // Replace with your own secret key

app.use(cookieParser());

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use(express.static('public'));

// MySQL connection configuration
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'mcfivem',
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Middleware for authenticating user
function authenticateUser(req, res, next) {
	try {
		const token = req.cookies.token;
		const decoded = jwt.verify(token, secretKey);
		req.user = decoded;
		next();
	} catch (err) {
		res.redirect('/login');
	}
}

// Register route - Render registration form
app.get('/register', (req, res) => {
	res.render('register');
});

// Register route - Handle registration form submission
app.post('/register', (req, res) => {
	const { email, password } = req.body;
	// Replace with your own registration logic
	pool.getConnection((err, connection) => {
		if (err) {
			console.error('Error connecting to MySQL:', err);
			return res.status(500).json({ error: 'Internal Server Error' });
		}

		const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
		connection.query(query, [email, password], (err, results) => {
			connection.release(); // Release the connection back to the pool
			if (err) {
				console.error('Error executing MySQL query:', err);
				return res.status(500).json({ error: 'Internal Server Error' });
			}
			res.redirect('/login');
		});
	});
});

// Login route - Render login form
app.get('/login', (req, res) => {
	res.render('login');
});

// Login route - Handle login form submission
app.post('/login', (req, res) => {
	const { email, password } = req.body;

	pool.getConnection((err, connection) => {
		if (err) {
			console.error('Error connecting to MySQL:', err);
			return res.status(500).json({ error: 'Internal Server Error' });
		}

		const query = 'SELECT * FROM users WHERE email = ? AND password = ?';

		connection.query(query, [email, password], (err, results) => {
			connection.release(); // Release the connection back to the pool
			if (err) {
				console.error('Error executing MySQL query:', err);
				return res.status(500).json({ error: 'Internal Server Error' });
			}

			if (results.length === 1) {
				const token = jwt.sign({ email }, secretKey, {
					expiresIn: '1h',
				});

				console.log('AAAAAAAAAAAAAA');

				res.cookie('token', token, { httpOnly: true });

				res.redirect('/');
			} else {
				res.status(401).json({ error: 'Invalid login details...' });
			}
		});
	});
});

app.get('/logout', (req, res) => {
	res.clearCookie('token');

	res.redirect('/login'); // Redirect to the login page or any other desired page
});

// Protected route
app.get('*', authenticateUser, (req, res) => {
	res.render('home', {
		user: req.user,
	});
});

// Start the server
app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
