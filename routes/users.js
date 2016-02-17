var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts/account');
var User = require('../models/accounts/index');
var router = express.Router();
var Group = require('../models/groups/index');
var multer = require('multer');
var configAuth = require('../config/auth');
var email = require('../models/accounts/email'),
    handlebars = require('hbs'),
    middleware = require('../middleware/authentication');

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
        res.render('user/index', { title: configAuth.app.name,
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

        res.render('user/followers', { title: configAuth.app.name,
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
        res.render('user/following', { title: configAuth.app.name,
          user : req.user, 
          expressFlash: req.flash('error'),
          user: user });
    });
  })
//make an account
router.route('/register')
  .get( function(req, res) {
    res.render('user/register', {expressFlash : req.flash('error') , title: configAuth.app.name});
  })
  /*
  Creating a user and sending an activation Email with a token
  that expires in one hour.
*/
  .post(uploading.single('image'), function(req, res) {
      email.register(req,res);
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
      email.newActivate(req,res);
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
    res.render('login', { user : req.user,  expressFlash:req.flash('error'), title: configAuth.app.name});
  })

  .post(passport.authenticate('local',{ successReturnToOrRedirect: "/", failureRedirect: '/login',failureFlash: true  }), function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.route('/forgot')
    .get(function (req,res) {
        res.render('forgot',{expressFlash: req.flash("error")});
    })
    .post(function(req, res) {
        email.forgotePass(req,res,api);
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
      email.resetPass(req,res);
    });
module.exports = router;
