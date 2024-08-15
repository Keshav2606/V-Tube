import app from './app.js';
import connectDB from './db/index.js';
import dotenv from 'dotenv';

dotenv.config({
    path: './.env'
})


connectDB()
.then(() => {
    const port = process.env.PORT || 8000
    app.listen(port, () => {
        console.log('Server is running at port: ', port);
    })
})
.catch((error) => {
    console.log('MONGODB CONNECTION ERROR: ', error);
    process.exit(1)
})