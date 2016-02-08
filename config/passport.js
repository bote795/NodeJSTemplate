var LocalStrategy = require ('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var configAuth = require('./auth');
var User = require('./../models/accounts/account');

var Account = require('./../models/accounts/account');
function createUser(token,profile,type,done)
{
	console.log(profile);
	var key = "google";
	//google
		//photos object
		//photos[0].value
	var name;
	if (type == "google") {
		key = "google";
		name = profile.displayName;
	}
	else if (type == "facebook"){
		key = "facebook";
		name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
	}
    var newUser          = new User();
    newUser.accountActivated = true;
    // set all of the relevant information
    newUser[key].id    = profile.id;
    newUser[key].token = token;
    newUser.username  = name;
    newUser.email = profile.emails[0].value; // pull the first email
        // save the user
    newUser.save(function(err) {
        if (err)
            throw err;
        return done(null, newUser);
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
                    createUser(token,profile,"google",done);
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
                        createUser(token,profile,"facebook",done);
                    }

                });
		});
	}));


            
		
};