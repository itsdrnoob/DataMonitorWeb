const requestIP = require('request-ip')
const express = require('express')
const router = express.Router()

router.get('/', function(req, res) {
    var ip = requestIP.getClientIp(req)
    res.send(ip)
})

module.exports = router