const express = require('express')
const app = express()
const xhr2 = require('xhr2')
const fetchIP = require('./fetchIP')

app.set('port', process.env.PORT || 8000)
/*
Returns the real IP address even if behind proxy
*/
app.set('trust proxy', true)

app.get('/', function(req, res) {
    res.status(200).send("Nothing to see here")
})

app.use('/fetchIP', fetchIP)

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})

/*
Export the Express API for Vercel serverless function
*/
module.exports = app