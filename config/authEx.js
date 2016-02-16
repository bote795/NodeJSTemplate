//change name to auth,js
var dbName = "gameRecords";
module.exports = {
     dbName: dbName,
     db: process.env.DB ||'mongodb://localhost/'+ dbName,
     app: {
        name: 'NAME OF APP'
      },
      //https://developers.facebook.com/
      //choose an app go to settings then go to advanced
    'facebookAuth' : {
        'clientID'      : 'DEFAULT_APP_ID', // your App ID
        'clientSecret'  : 'APP_SECRET', // your App Secret
        'callbackURL'   : 'https://localhost:3000/auth/facebook/callback',
        'enabled'       : true
    },

    /*
        setting up
        http://stackoverflow.com/questions/24352975/passport-google-oauth-on-localhost
        enable google+ API
    */
    'googleAuth' : {
        'clientID'      : 'DEFAULT_APP_ID',
        'clientSecret'  : 'APP_SECRET',
        'callbackURL'   : 'https://localhost:3000/auth/google/callback',
        'enabled'       : true
    },
    emailFrom: 'SENDER EMAIL ADDRESS', //  sender address like ABC <abc@example.com>
    mailer: {
        service: 'SERVICE_PROVIDER', // Gmail, SMTP
        auth: {
          user:  'EMAIL_ID',
          pass: 'PASSWORD',
          key: 'YOUR_AMAZON_KEY',
          secret_key: 'YOUR_AMAZON_SECRET_KEY'
        },
    }, 
    secret: 'SOME_TOKEN_SECRET',
    //to navigate to this go to /mongo_express
    mongoAdmin: {
            SSL_CRT_PATH: __dirname +'/../cert.pem',
            SSL_KEY_PATH: __dirname +'/../key.pem',
            SSL_ENABLED: true,
            MONGODB_ENABLE_ADMIN: true,
            auth: {
                user: "ENTER USERNAME HERE",
                pass: "ENTER PASSWORD HERE"
            }
    }    
};