var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts/account');
var User = require('../models/accounts/index');
var router = express.Router();
var Group = require('../models/groups/index');
var multer = require('multer');
var configAuth = require('../config/auth');
var async = require("async"),
    crypto = require("crypto"),
    nodemailer = require("nodemailer"),
    mg = require('nodemailer-mailgun-transport'),
    hbs = require('nodemailer-express-handlebars'),
    fs = require('fs'),
    handlebars = require('hbs'),
    middleware = require('../middleware/authentication'),
    connTemplate = fs.readFileSync(__dirname + '/../views/user/_connectionsInfo.hbs', 'utf8'),
    miniTemplate = fs.readFileSync(__dirname + '/../views/user/_userMiniTemplate.hbs', 'utf8');
    handlebars.registerPartial('connections', connTemplate); 
    handlebars.registerPartial('userMini', miniTemplate); 

var configsMail = {
    service: configAuth.mailer.service,
    auth: {
    user:  configAuth.mailer.auth.user,
    pass: configAuth.mailer.auth.pass
  }
}
var nodemailerMailgun = nodemailer.createTransport(configsMail);

//parameters to upload files
var uploading = multer({
  dest: __dirname + '/../public/uploads/',
  limits: {fileSize: 1000000, files:1},
  fileFilter: function (req, file, cb) {
    //only allow image files
    if (file.mimetype.indexOf("image") == -1) {
        req.flash('error',"Didn't upload file. File type is not an image!")
        return cb(null,false);
    }
    cb(null,true);
  },
});

/*
  uploading.single('image') = used when form has a file
  image is the name of the field of the file
*/


router.get('/', function (req, res) {
    var stats={};
    stats.countFollowers = 0;
    stats.countFollowing = 0;
    Group.all( function(err, data) {
        if (err) 
        {
            res.json(err);
        }
        if (req.isAuthenticated()) {
          //count number of follers
          if ('followers' in req.user)
            stats.countFollowing = req.user.following.length;
          //count number of people following
          if ('following' in req.user) 
            stats.countFollowers = req.user.followers.length;
        };
        res.render('user/index', { title: "Game Records",
          user : req.user, 
          groups: data, 
          expressFlash: req.flash('error'),
          stats: stats });
    });
});

/*
  Route to be able to see other peoples profiles
*/
router.route('/:username/public')
  .get(function(req, res) {
    var isFollowing = false;
    var stats={};
    stats.countFollowers = 0;
    stats.countFollowing = 0;   

    User.get(req.params.username,function (err, user) {
      if (err) {
        req.flash('error', "User doesn't exist")
        return res.redirect('/');  
      };

      //check to see if user is already following specific user
      if (req.isAuthenticated()) {
        if ('following' in req.user) {
          if (req.user.following.indexOf(user._id) > -1) 
          {
            isFollowing=true;
          };

        }
      }; 

      //count number of follers
      if ('followers' in user)
        stats.countFollowing = user.following.length;
      //count number of people following
      if ('following' in user) 
        stats.countFollowers = user.followers.length;
      res.render('user/public', {publicUser: user , 
        user: req.user, 
        isFollowing: isFollowing,
        expressFlash: req.flash('error'),
        stats: stats})
    },true)
  })

/*
  update following
*/
router.route('/follow/:id')
  .get(function(req,res) {
    if (!req.isAuthenticated())
    {
      req.flash("error","Need to login to be able to follow someone");
      return res.redirect("/login");
    }
    req.body["following"]=req.params.id;

    //that user now follows the target
    User.put(req,function (err,user) {
      if(err)
      {
        req.flash("error","couldn't update following properly");
        return res.redirect("back");
      }
      //the target now is being followed by current user
      var temp = {};
      temp.body={};
      temp.body["followers"]=req.user.id;
      User.put(temp,function (err,user) {
        if (err) {
          req.flash("error","couldn't update followers properly");
          return res.redirect("back");   
        };
        return res.redirect("/"+user.username+"/public/");
      },false, null, true, req.params.id)
    })
  })
/*
  update unfollow
*/
router.route('/unfollow/:id')
  .get(function(req,res) {
    if (!req.isAuthenticated())
    {
      req.flash("error","Need to login to be able to unfollow someone");
      return res.redirect("/login");
    }
    User.removeFromArray(req.user._id,"following",req.params.id,function(err) {
        if(err)
        {
          req.flash("error","couldn't unfollow");
          return res.redirect("back");
        }
      User.removeFromArray(req.params.id, "followers", req.user._id,function (err,user) {
        if (err) {
          req.flash("error","couldn't remove follower");
          return res.redirect("back");          
        };
        return res.redirect("/"+user.username+"/public");  
      })
      
    })
  })

/*
  show all users followers
*/
router.route('/:id/followers')
  .get(function(req,res) {
    User.getUsers(req.params.id,"followers",function(err,user) {

        res.render('user/followers', { title: "Game Records",
          user : req.user, 
          expressFlash: req.flash('error'),
          user: user });
    });
  })
/*
  show all users the user is following
*/
router.route('/:id/following')
  .get(function(req,res) {
     User.getUsers(req.params.id,"following",function(err,user) {
        res.render('user/following', { title: "Game Records",
          user : req.user, 
          expressFlash: req.flash('error'),
          user: user });
    });
  })
//make an account
router.route('/register')
  .get( function(req, res) {
    res.render('user/register', {expressFlash : req.flash('error') });
  })
  /*
  Creating a user and sending an activation Email with a token
  that expires in one hour.
*/
  .post(uploading.single('image'), function(req, res) {
          async.waterfall([
          function(done) {
            crypto.randomBytes(20, function(err, buf) {
              var token = buf.toString('hex');
              done(err, token);
            });
          },
          function(token, done) {
            req.body.token = token;
            User.create(req, function(err, account) {
              if (err) {
                  return res.render('user/register', { account : account ,
                   expressFlash : req.flash('error') });
              }
              done(err, token, account);
            });
          },
          function(token, user, done) {
            var options = {
                 viewEngine: {
                     extname: '.hbs',
                     layoutsDir: 'views/email/',
                     defaultLayout : 'accountConfirmation',
                     partialsDir : 'views/email/partials/'
                 },
                 viewPath: 'views/email/',
                 extName: '.hbs'
              };
            nodemailerMailgun.use('compile',hbs(options));
            var mailOptions = {
              to: user.email,
              from: 'passwordreset@demo.com',    //change from
              subject: 'GameRecords Activation email', //change the subject
              template: 'accountConfirmation',
              context: {
                host: req.headers.host,
                token: token
              }
            };
            nodemailerMailgun.sendMail(mailOptions, function(err,info) {
              if (err) 
              {
                 req.flash('error', "Error with sending confirmation Email")
                  console.log("Error");
                  console.log(err);
              }
              else
              {
                  req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                  console.log('An e-mail has been sent to ' + user.email + ' with further instructions.');
                  console.log('Response' + info);
              }
              done(err, 'done');
            });
          }
          ], 
          function(err) {
          if (err) return res.render('user/register', {expressFlash: req.flash("error")});;
          res.render('user/register', {expressFlash: req.flash("success")});
          });
          /*
          passport.authenticate('local')(req, res, function () {
              res.redirect('/');
          });
          */
      
  });

/*
  google login routes
*/
  if(configAuth.googleAuth.enabled)
  {
    router.route('/auth/google')
      .get( passport.authenticate('google', 
        { successReturnToOrRedirect: "/",scope : ['profile', 'email'] }));

    router.route('/auth/google/callback')
      .get(passport.authenticate('google', { successReturnToOrRedirect: "/",
        successRedirect : '/',
        failureRedirect: '/login' 
      }))
  }

/*
  facebook login routes
*/
  if(configAuth.facebookAuth.enabled)
  {
    router.route('/auth/facebook')
      .get(passport.authenticate('facebook', 
        {successReturnToOrRedirect: "/", scope : 'email' }));
        // handle the callback after facebook has authenticated the user
    router.route('/auth/facebook/callback')
      .get(passport.authenticate('facebook', {successReturnToOrRedirect: "/",
            successRedirect : '/',
            failureRedirect : '/login'
        }));
  }
/*
  Activates account for user
*/
router.route('/activate/:token')
  .get(function(req,res) {
          User.findByTokenExpire(req.params.token, function (err, user) {
            if (err) {
              req.flash('error',"Token was invalid or expired");
              return res.redirect('back');
            };
            user.activateAccountToken = undefined;
            user.activateAccountExpires = undefined;
            user.accountActivated = true;
            user.save();
            req.logIn(user, function(err) {
                if (err) {
                  req.flash('error',"Logging in user");
                  return res.redirect('back');
                };
                //done(null, user);
                return res.redirect('/')
            });
          },true);
  })
/*
  request a new activation token
*/
router.route('/activate')
  .get(function(req,res) {
    res.render('user/activate')
  })
  .post(function(req,res) {
      async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {

        User.findByEmailToken(req.body.email,token, function(err, token, account) {
          if (err) {
              req.flash('error', " No account with that email was found");
              return res.render('back');
          }
          done(err, token, account);
        },true);
      },
      function(token, user, done) {
        //options for rendering hbs
        var options = {
             viewEngine: {
                 extname: '.hbs',
                 layoutsDir: 'views/email/',
                 defaultLayout : 'accountConfirmation',
                 partialsDir : 'views/email/partials/'
             },
             viewPath: 'views/email/',
             extName: '.hbs'
          };
        nodemailerMailgun.use('compile',hbs(options));
        var mailOptions = {
          to: user.email,
          from: 'passwordreset@demo.com',    //change from
          subject: 'GameRecords Activation email', //change the subject
          template: 'accountConfirmation',
          context: {
            host: req.headers.host,
            token: token
          }
        };
        nodemailerMailgun.sendMail(mailOptions, function(err,info) {
          if (err) 
          {
             req.flash('error', "Error with sending confirmation Email")
              console.log("Error");
              console.log(err);
          }
          else
          {
              req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
              console.log('An e-mail has been sent to ' + user.email + ' with further instructions.');
              console.log('Response' + info);
          }
          done(err, 'done');
        });
      }
      ], 
      function(err) {
      if (err) return res.render('user/activate', {expressFlash: req.flash("error")});;
      res.render('user/activate', {expressFlash: req.flash("success")});
      });
  })
//routes to edit user basic info
router.route('/edit')
    .get(middleware.isAuthenticated,function(req, res) {
        res.render('user/edit', { user : req.user });
    })
    //route to change user information
    .post(middleware.isAuthenticated,uploading.single('image'), function(req, res) {
        console.log(req.body);
        User.put(req,function (err,user) {

            //refresh user data for session (passport)
            req.login(user, function(err) {
                if (err) return next(err)
                req.flash('error', "Successfuly Changed Data"); 
                res.render('user/edit', { user : req.user , 
                  expressFlash: req.flash("error")});
            })
        })
    });
//routes to edit password    
router.route('/editPass') 
    .get(middleware.isAuthenticated,function (req,  res) {
        res.render('user/editPass', {});
    }) 
    /*
    Todo need to check on client side 
        size and passwords match
    Do length check must be bigger than X
    */
    .post(middleware.isAuthenticated,function(req, res) {
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
                    req.flash('error',"An error occurred");
                    res.render('user/editPass',{expressFlash: req.flash('error') })
                }
                  req.flash('success',"Password Change successful!");
                  res.render('user/editPass',{expressFlash: req.flash('success')})
            })
            
        }
        else
        {

            req.flash('error',"An error occurred");
            res.render('user/editPass',{expressFlash: req.flash('error') })
        }
    });
router.route('/login')
  .get(function(req, res) {
    res.render('login', { user : req.user,  expressFlash:req.flash('error')});
  })

  .post(passport.authenticate('local',{ successReturnToOrRedirect: "/", failureRedirect: '/login',failureFlash: true  }), function(req, res) {
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
        res.render('forgot',{expressFlash: req.flash("error")});
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
          User.findByEmailToken(req.body.email, token,function(err,token,user) {
            if (err) {
              req.flash('error', "Token or email not found")
              return res.render('forgot', {expressFlash: req.flash("error")});
            };
            done(err, token, user);
          });
        },
        function(token, user, done) {
            var options = {
             viewEngine: {
                 extname: '.hbs',
                 layoutsDir: 'views/email/',
                 defaultLayout : 'forgotePass',
                 partialsDir : 'views/email/partials/'
             },
             viewPath: 'views/email/',
             extName: '.hbs'
         };
          nodemailerMailgun.use('compile',hbs(options));
          var mailOptions = {
            to: user.email,
            from: 'passwordreset@demo.com',    //change from
            subject: 'Node.js Password Reset', //change the subject
            template: 'forgotePass',
            context: {
              host: req.headers.host,
              token: token
            }
          };
          nodemailerMailgun.sendMail(mailOptions, function(err,info) {
            //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            if (err) 
            {
               req.flash('error', "Error with sending Email")
                console.log("Error");
                console.log(err);
            }
            else
            {
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                console.log('An e-mail has been sent to ' + user.email + ' with further instructions.');
                console.log('Response' + info);
            }
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err) return res.render('forgot', {expressFlash: req.flash("error")});;
        res.render('forgot', {expressFlash: req.flash("success")});
      });        

    });
router.route('/reset/:token')
    .get(function(req, res) {
      User.findByTokenExpire(req.params.token, function (err, user) {
        if (!user) {
          //'Password reset token is invalid or has expired..
          req.flash('error', "password token is invalid or old");
          return res.redirect('/forgot', {expressFlash: req.flash('error')});
        };      
        res.render('reset', {
          user: req.user
        });
      })
    })
    .post(function(req, res) {
      async.waterfall([
        function(done) {
          User.resetPassword(req.params.token, req.body.password, function (err, user) {
            if (err) {
              req.flash('error',"Token was invalid");
              return res.redirect('back');
            };
            req.logIn(user, function(err) {
                if (err) {
                  return res.redirect('back');
                };
                done(null, user);
            });
          });
        },
        function(user, done) {
            var options = {
               viewEngine: {
                   extname: '.hbs',
                   layoutsDir: 'views/email/',
                   defaultLayout : 'confirmationReset',
                   partialsDir : 'views/email/partials/'
               },
               viewPath: 'views/email/',
               extName: '.hbs'
           };
          nodemailerMailgun.use('compile',hbs(options));
          var mailOptions = {
            to: user.email,
            from: 'passwordreset@demo.com',
            subject: 'Your password has been changed',
            template: 'confirmationReset',
            context: {
              email: user.email
            }
            };
          nodemailerMailgun.sendMail(mailOptions, function(err, info) {
            //req.flash('success', 'Success! Your password has been changed.');
           if (err) 
            {
                console.log("Error");
                req.flash('error',"An error occurred");
                console.log(err);
            }
            else
            {
                console.log('An e-mail has been sent to ' + user.email + ' with further instructions.');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
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
