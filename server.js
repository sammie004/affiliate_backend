// dependencies
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const app = express()
const routes = require('./routes/routes');
dotenv.config()
// usages
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.get('/',(req,res)=>{
    res.send(`this is just a testing route`)
})
app.use('/api',routes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})