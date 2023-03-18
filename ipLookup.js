const express = require('express')
const router = express.Router()
const requestIP = require('request-ip')
const { IPinfoWrapper, ApiLimitError } = require("node-ipinfo")
const rateLimit = require('express-rate-limit')

const apiLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 25,
    message: "Too many requests, please try again later."
})

router.get('/', apiLimit, function(req, res) {
    var token = req.get('token')
    if (token == process.env.TOKEN) {
        const ipinfo = new IPinfoWrapper(process.env.IP_TOKEN)
        var clientIP = requestIP.getClientIp(req)
        ipinfo.lookupIp(clientIP)
        .then((result) => {
            var jsonResponse = {
                ip: result.ip,
                city: result.city,
                region: result.region,
                country: result.country,
                org: result.org
            }
            res.send(jsonResponse)
        })
        .catch((error) => {
            console.log(error);
            if (error instanceof ApiLimitError) {
                res.status(500).send("Limit Exeeded")
            }
            else {
                res.status(500).send("An unknown error occurred")
            }
        })
    }
    else {
        res.status(403).send("Invalid Request Token")
    }
})

module.exports = router