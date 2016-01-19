var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts/account');
var User = require('../models/accounts/index');
var router = express.Router();
var Group = require('../models/groups/index');
var multer = require('multer');
var async = require("async"),
    crypto = require("crypto"),
    nodemailer = require("nodemailer"),
    mg = require('nodemailer-mailgun-transport');
var env = require('node-env-file');
 // Load any undefined ENV variables from a specified file.
env(__dirname+"/.." + '/.env');
var email = process.env.EMAIL;
var emailPass = process.env.PASS;
var configsMail = {
    service: "Hotmail",
    auth: {
    user:  email,
    pass: emailPass
  }
}

var nodemailerMailgun = nodemailer.createTransport(configsMail);


var uploading = multer({
  dest: __dirname + '/../public/uploads/',
  limits: {fileSize: 1000000, files:1},
});
/*
uploading.single('image') = used when form has a file
image is the name of the field of the file
TODO: need to confirm that file is an image
*/

router.get('/', function (req, res) {
    Group.all( function(err, data) {
        if (err) 
        {
            res.json(err);
        }
        res.render('index', { title: "Game Records",user : req.user, groups: data });
    });
});

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.post('/register', uploading.single('image'), function(req, res) {
    User.create(req, function(err, account) {
        if (err) {
            return res.render('register', { account : account , err : err });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});
router.route('/edit')
    .get(function(req, res) {
        res.render('edit', { user : req.user });
    })
    //route to change user information
    .post(uploading.single('image'), function(req, res) {
        console.log(req.body);
        User.put(req,function (err,user) {

            //refresh user data for session (passport)
            req.login(user, function(err) {
                if (err) return next(err)
                res.render('edit', { user : req.user });
            })
        })
    });
router.route('/editPass') 
    .get(function (req,  res) {
        res.render('editPass', {});
    }) 
    /*
    Todo need to check on client side 
        size and passwords match
    Do length check must be bigger than X
    */
    .post(function(req, res) {
        var pas1 = req.body.password.trim();
        var pas2 = req.body.password2.trim();
        var flash={};
        //if both fields contian something 
        //and they are the same
        if (pas1 && pas2 && (pas1 == pas2))
        {
            User.putPass(req.user._id, pas1,function (err) {
                if (err) 
                {
                    flash = {
                    type: 'error',
                    message: err
                    };
                    //res.send(err);
                }
                flash = {
                    type: 'success',
                    message: 'Password Change successful!'
                };
                    res.render('editPass',{sessionFlash: flash })
            })
            
        }
        else
        {
            flash = {
                    type: 'error',
                    message: "Mess"
            };
            res.render('editPass',{sessionFlash: flash })
        }
    });

router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

router.route('/forgot')
    .get(function (req,res) {
        res.render('forgot',{});
    })
    .post(function(req, res) {
        async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          Account.findOne({ email: req.body.email }, function(err, user) {
            if (!user) {
              //req.flash('error', 'No account with that email address exists.');
              //return res.redirect('/forgot');
              return res.send(err);
            }

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {

          var mailOptions = {
            to: user.email,
            from: 'passwordreset@demo.com',
            subject: 'Node.js Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/reset/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
          nodemailerMailgun.sendMail(mailOptions, function(err,info) {
            //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            if (err) 
            {
                console.log("Error");
                console.log(err);
            }
            else
            {
                console.log('An e-mail has been sent to ' + user.email + ' with further instructions.');
                console.log('Response' + info);
            }
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err) return res.json(err);
        res.render('forgot', {});
      });        

    });
router.route('/reset/:token')
    .get(function(req, res) {
      Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('reset', {
          user: req.user
        });
      });
    })
    .post(function(req, res) {
      async.waterfall([
        function(done) {
          Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, 
            function(err, user) {
            if (!user) {
              //req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }

            user.setPassword(req.body.password, function () {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
            });


          });
        },
        function(user, done) {

          var mailOptions = {
            to: user.email,
            from: 'passwordreset@demo.com',
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
          };
          nodemailerMailgun.sendMail(mailOptions, function(err, info) {
            //req.flash('success', 'Success! Your password has been changed.');
           if (err) 
            {
                console.log("Error");
                console.log(err);
            }
            else
            {
                console.log('An e-mail has been sent to ' + user.email + ' with further instructions.');
                console.log('Response' + info);
            }
            done(err, 'done');
          });
        }
      ], function(err) {
        res.redirect('/');
      });
    });
module.exports = router;
