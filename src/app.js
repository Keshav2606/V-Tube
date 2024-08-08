import express from "express";

const app = express()

const port = process.env.PORT

app.get('/', (req, res) => {
    res.send('<h1>Jai Shree Ganesh</h1>');
})

app.listen(port, () => {
    console.log(('Express is initiated in the project.'));
})