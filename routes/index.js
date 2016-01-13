var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts/account');
var router = express.Router();
var Group = require('../models/groups/index');
var multer = require('multer');

var uploading = multer({
  dest: __dirname + '/../public/uploads/',
  limits: {fileSize: 1000000, files:1},
});

router.post('/upload', uploading.single('image'), function(req, res) {
    res.json(req.file);
    console.loge(req.file);
    console.log("uploaded?");
});
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

router.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
	    console.log(err);
            return res.render('register', { account : account , err : err });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
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
