import express from 'express';

const app = express();


// port
const PORT = process.env.PORT || 5000;

// Listner
app.listen(PORT, () => console.log('server is running on $(PORT)'));