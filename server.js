// dependencies
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const app = express()
dotenv.config()
// usages
app.use(express.json())
app.use(cors())

app.get('/',(req,res)=>{
    res.send(`this is just a testing route`)
})
app.use('/api',require('./routes/routes'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})