var LocalStrategy = require ('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var configAuth = require('./auth');
var User = require('./../models/accounts/account'),
    Image = require('./../models/images/image'),
    nodemailer = require("nodemailer"),
    hbsMailer = require('nodemailer-express-handlebars'),
    Account = require('./../models/accounts/account'),
    ses = require('nodemailer-ses-transport');
    
var nodemailerMailgun = nodemailer.createTransport(ses({
    accessKeyId: configAuth.mailer.auth.key,
    secretAccessKey: configAuth.mailer.auth.secret_key
}));
//var nodemailerMailgun = nodemailer.createTransport(configsMail);

function createUser(token,profile,done)
{
	console.log(profile);
	var key = "google";
    //TODO learn how to save images from other websites locally
	//google
		//photos object
		//photos[0].value url
    //facebook
        //photos object
        //photos[0].value url
	if (profile.provider == "google") {
		key = "google";
	}
	else if (profile.provider == "facebook"){
		key = "facebook";
	}
    var newUser          = new User();
    newUser.accountActivated = true;
    // set all of the relevant information
    newUser[key].id    = profile.id;
    newUser[key].token = token;
    newUser.username  = profile.displayName;
    newUser.email = profile.emails[0].value; // pull the first email
        // save the user
    if (profile.photos.length > 0) {
      var newImage  = new Image();
      newImage.remote = true;
      newImage.link= profile.photos[0].value;
      newImage.save(function(err){
        if (err) {
          return done(err)
        }
        //saves imadeid to newuser
        newUser.image=newImage._id;
        newUser.avatars=[newImage._id];
        newUser.save(function(err) {
          if (err)
              return done(err);
          welcomeEmail(newUser);
          return done(null, newUser);
        });
      });
    }  
    else{
      newUser.save(function(err) {
          if (err)
              return done(err);
          welcomeEmail(newUser);
          return done(null, newUser);
      });
    }
}

function welcomeEmail (user) {
    var options = {
         viewEngine: {
             extname: '.hbs',
             layoutsDir: 'views/email/',
             defaultLayout : 'welcome',
             partialsDir : 'views/email/partials/'
         },
         viewPath: 'views/email/',
         extName: '.hbs'
      };
    nodemailerMailgun.use('compile',hbsMailer(options));

    var mailOptions = {
      to: user.email,
      from: configAuth.emailFrom,    //change from
      subject: 'GameRecords welcome email', //change the subject
      template: 'accountConfirmation',
      context: {
        title: "Game Records",
      }
    };
    console.log(mailOptions);
    nodemailerMailgun.sendMail(mailOptions, function(err,info) {
      if (err) 
      {
          console.log("Error");
          console.log(err);
      }
      else
      {
          console.log('An e-mail has been sent to ' + user.email + ' with welcome email.');
          console.log('Response' + info);
      }
      
    });
}
module.exports = function(passport) {
	passport.use(new LocalStrategy(Account.authenticate()));
	passport.serializeUser(Account.serializeUser());
	passport.deserializeUser(Account.deserializeUser());

	// Use google strategy
	passport.use(new GoogleStrategy({
	    clientID        : configAuth.googleAuth.clientID,
	    clientSecret    : configAuth.googleAuth.clientSecret,
	    callbackURL     : configAuth.googleAuth.callbackURL,
	    realm: 'http://localhost:3000/'
	  },
	  function(token, refreshToken, profile, done) {
     	// make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {

            // try to find the user based on their google id
            User.findOne({ 'google.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);

                if (user) {

                    // if a user is found, log them in
                    return done(null, user);
                } else {
                    // if the user isnt in our database, create a new user
                    createUser(token,profile,done);
                }
            });
        });

    }));
	
	//use facebook strategy
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'displayName', 'photos', 'email'],
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {
	 // find the user in the database based on their facebook id
                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user found with that facebook id, create them
                        createUser(token,profile,done);
                    }

                });
		});
	}));


            
		
};