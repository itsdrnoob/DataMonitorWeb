const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const Validator = require('google-play-billing-validator')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })
const UUID = require('uuid-v4')
const https = require('https')
require('dotenv').config()

const admin = require('firebase-admin')

const serviceAccount = {
    type: process.env.FIREBASE_ACCOUNT_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
})

const database = admin.database()
const storage = admin.storage()
const storageBucket = storage.bucket()

const packageName = 'com.drnoob.datamonitor'

const apiLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: "Too many requests, please try again later."
})


/** 
 * @GET wallOfThanks/
 * Returns a JSON object with two arrays: "donors" and "featuredDonors",
 * each containing a list of donor objects with the "name" and "photoURL" properties.
*/
router.get("/", apiLimit, function(req, res) {
    var donorsList = {}
    var donors = []
    var featuredDonors = []
    
    database.ref("/wallOfThanks").orderByChild('amount').once("value", (snapshot) => {
        snapshot.forEach((data) => {
            var donor = {
                name: data.child("name").val(),
                photoURL: data.child("image").val() 
            }
            donors.push(donor)
        })

        donors.reverse()
        var i = 0
        donors.forEach((donor) => {
            if (i < 3) {
                featuredDonors.push(donor)
            }
            i += 1
        })

        donorsList.donors = donors
        donorsList.featuredDonors = featuredDonors

        res.send(donorsList)
    })
    .catch((error) => {
        console.log(error)
        res.send(error)
    })
})


/**
 * @POST wallOfThanks/
 * Sends a post request to add the user to donors list.
 * Includes name, purchaseToken, productId and userUid as headers and userImage as form-data
 */
router.post("/", apiLimit, upload.single('image'), function(req, res) {
    var purchaseToken = req.get('token')
    var productId = req.get('id')
    var uid = req.get('uid')
    var name = req.get('name')
    var image = req.file

    var credentials = {
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
    
    var tokenValidator = new Validator(credentials)

    var receipt = {
        packageName: packageName,
        productId: productId,
        purchaseToken: purchaseToken
    }

    tokenValidator.verifyINAPP(receipt)
    .then((result) => {
        if (isPurchaseValid(result)) {
            // Valid purchase token
            var amount = parseInt(productId.split('_')[1])
            uploadUserData(uid, name, image, purchaseToken, amount)
            .then((result) => {
                res.send(result)
            })
            .catch((error) => {
                console.error(error)
                res.send(error)
            })
        }
        else {
            // Invalid purchase token
            res.send("The purchase was refunded or the token is Invalid")
        }
    })
    .catch((error) => {
        console.error("Purchase token verification error: ", error)
        res.send(error.errorMessage)
    })

})


/**
 * @GET /about
 * @returns info about Wall of Thanks
 */
router.get("/about", function(req, res) {
    res.sendFile(__dirname +  '/public/wall-of-thanks/index.html')
})




function isPurchaseValid(response) {
    var purchaseState = response.payload.purchaseState
    return purchaseState === 0
}

function createUserImage(letter) {
    return new Promise((resolve, reject) => {
        const url = `https://userimagebuilder.vercel.app?letter=${letter}`
        https.get(url, (result) => {
            var chunks = []
            result.on('data', (chunk) => {
                chunks.push(chunk)
            })

            result.on('end', () => {
                var buffer = Buffer.concat(chunks)
                resolve(buffer)
            })
        })
        .on('error', (error) => {
            reject(error)
        })
    })
}

function uploadUserData(uid, name, image, purchaseToken, amount) {
    return new Promise((resolve, reject) => {
        database.ref('wallOfThanks/' + uid).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // user is alredy present in database
                var isFreshToken = !snapshot.child('token').forEach((tokenSnapshot) => {
                    return tokenSnapshot.val() == purchaseToken
                })

                if (isFreshToken) {
                    var previousAmount = parseInt(snapshot.child('amount').val())
                    var updatedAmount = previousAmount + amount
                    database.ref('wallOfThanks/').child(uid).child('amount').set(updatedAmount)
                    .then(() => {
                        // Amount updated
                        database.ref('wallOfThanks/').child(uid).child('token').push(purchaseToken)
                        .then(() => {
                            resolve("DONE")
                        })
                        .catch((error) => {
                            console.error(`Failed to save purchase token, ${purchaseToken}`, error)
                            reject(error)
                        })
                    })
                    .catch((error) => {
                        console.error(error)
                        reject(error)
                    })
                }
                else {
                    reject("DUPLICATE_TOKEN")
                }
            }
            else {
                // User is not present
                if (name == undefined) {
                    name = 'Unknown'
                }
                var data = {
                    name: name,
                    amount: amount
                }
                database.ref('wallOfThanks/').child(uid).set(data)
                .then((result) => {
                    console.log("User data uploaded successfully.")
                    // save purchase token
                    database.ref('wallOfThanks/').child(uid).child('token').push(purchaseToken)
                    .catch((error) => {
                        console.error(`Failed to save purchase token, ${purchaseToken}`, error)
                        reject(error)
                    })
                    // upload image and set url
                    var imageBuffer
                    var fileExtenstion
                    if (image == undefined) {
                        createUserImage(name.charAt(0).toUpperCase())
                        .then((imageBuffer) => {
                            fileExtenstion = 'png'
                            uploadUserImage(imageBuffer, uid, fileExtenstion)
                            .then((result) => {
                                resolve(result)
                            })
                            .catch((error) => {
                                reject(error)
                            })
                        })
                        .catch((error) => {
                            console.log("Failed to create image", error)
                            reject(error)
                        })
                    }
                    else {
                        imageBuffer = image.buffer
                        fileExtenstion = image.mimetype.split('/')[1]
                        uploadUserImage(imageBuffer, uid, fileExtenstion)
                        .then((result) => {
                            resolve(result)
                        })
                        .catch((error) => {
                            reject(error)
                        })
                    }
                })
                .catch((error) => {
                    console.log("Failed to set data")
                    console.error(error)
                    reject(error)
                })
            }
        })
        .catch((error) => {
            reject(error)
        })
    })
}

function uploadUserImage(imageBuffer, uid, fileExtenstion) {
    return new Promise((resolve, reject) => {
        var contentType = `image/${fileExtenstion}`
        var filename = `${uid}.${fileExtenstion}`
        
        var file = storageBucket.file(`wallOfThanks/${filename}`)
        var token = UUID()

        file.save(imageBuffer, {
            metadata: {
                contentType: contentType,
                metadata: {
                    firebaseStorageDownloadTokens: token
                }
            }
        })
        .then(() => {
            var imageURL = `https://firebasestorage.googleapis.com/v0/b/${storageBucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${file.metadata.metadata.firebaseStorageDownloadTokens}`
            var userImage = {
                image: imageURL
            }
            database.ref('wallOfThanks/').child(uid).update(userImage)
            .then(() => {
                // saved image link to database
                resolve("DONE")
            })
            .catch((error) => {
                console.error("Failed to set user image")
                reject(error)
            })
        })
        .catch((error) => {
            console.error(error)
            reject(error)
        })
    })
}

module.exports = router