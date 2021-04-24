import express from 'express';
import router from './routes/auth.js';
import authRoute from './routes/auth.js';
import postRoute from './routes/posts.js';
import profileRoute from './routes/profile.js';
import usersRoute from './routes/users.js';
import connectDB from './config/db.js';

//connecting to database
connectDB();
const app = express();

// port
const PORT = process.env.PORT || 5000;

app.use('/auth', authRoute);
app.use('/post', postRoute);
app.use('/profile', profileRoute);
app.use('/users', usersRoute);
// Listner
app.listen(PORT, () => console.log('server is running on port 5000'));
