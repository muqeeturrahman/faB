const admin = require('firebase-admin');

const serviceAccount = require('../fate-app-4562bd47508d.json');

admin.initializeApp({
    credential : admin.credential.cert(serviceAccount)
});

