var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts/account');
var User = require('../models/accounts/index');
var router = express.Router();
var Group = require('../models/groups/index');
var multer = require('multer');

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

module.exports = router;
