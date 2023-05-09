const express = require('express')
const app = express()
const fetchIP = require('./fetchIP')
const ipLookup = require('./ipLookup')
const wallOfThanks = require('./wall-of-thanks')

require('dotenv').config()

app.set('port', process.env.PORT || 8000)
/*
Returns the real IP address even if behind proxy
*/
app.set('trust proxy', true)

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.sendFile('./public/index.html')
})

app.use('/fetchIP', fetchIP)
app.use('/ipLookup', ipLookup)
app.use('/wallOfThanks', wallOfThanks)

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})

/*
Export the Express API for Vercel serverless function
*/
module.exports = app
