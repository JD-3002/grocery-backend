const express = require("express")
const app = express()
require("dotenv").config()


const PORT = process.env.PORT

app.use(express.json())

app.get("/", (req,res)=>{
    res.json({
        message:"Welcome to my Server",
    })
})

app.listen(PORT || 5000 , ()=>{
    console.log(`Server is Listening on Port ${PORT}`)
})