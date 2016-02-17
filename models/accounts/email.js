'use strict';
var configAuth = require('../../config/auth'),
	async = require("async"),
    crypto = require("crypto"),
    nodemailer = require("nodemailer"),
    mg = require('nodemailer-mailgun-transport'),
    hbs = require('nodemailer-express-handlebars'),
    fs = require('fs'),
    handlebars = require('hbs'),
    connTemplate = fs.readFileSync(__dirname + '/../../views/user/_connectionsInfo.hbs', 'utf8'),
    miniTemplate = fs.readFileSync(__dirname + '/../../views/user/_userMiniTemplate.hbs', 'utf8');
    handlebars.registerPartial('connections', connTemplate), 
    handlebars.registerPartial('userMini', miniTemplate);
    var ses = require('nodemailer-ses-transport'),
	Account = require('./account'),
	User = require('./index');
    var nodemailerMailgun= nodemailer.createTransport(ses({
    	accessKeyId: configAuth.mailer.auth.key,
    	secretAccessKey: configAuth.mailer.auth.secret_key
	}));
    function defaultVars (api) {
        return api = typeof api !== 'undefined' ? api : false;
    }
    function error(err,api,error, render, res, redirect){
     var redirect = typeof api !== 'undefined' ? api : false;
     if (err) {
            if (api) {
                return res.json(error);
            }   
            else
            {
              if(redirect) return res.redirect(render.uri);
              return res.render(render.uri, render.params);
                
            }
              

      }
    }
module.exports = {
    /*
      Creating a user and sending an activation Email with a token
      that expires in one hour.
    */
      register: function (req,res, api) {
        var api = defaultVars(api);
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
                var errorParam = {error: true, message: req.flash('error')};
                var params = { uri: 'user/register',params: {expressFlash : req.flash('error') }};
                return error(err,api, errorParam, params);
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
              from: configAuth.emailFrom,    //change from
              subject: configAuth.app.name +'Activation email', //change the subject
              template: 'accountConfirmation',
              context: {
                title: configAuth.app.name,
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
            if (err) {
                var errorParam = {error: true, message: req.flash('error')};
                var params = { uri: 'user/register',params: {expressFlash: req.flash("error")}};
                return error(err,api, errorParam, params);
            }
            if (api) 
            {
                return res.json({expressFlash: req.flash("success")})
            }
            else
            {
                return res.render('user/register', {expressFlash: req.flash("success")});
            }
          });
    },

    /**
     * request a new token
     * @param  {[type]} req [request]
     * @param  {[type]} res [response]
     * @param  {Boolean} api [if api call then pass true other wise false]
     * @return {[type]}     [json if api or rendering a page]
     */
    newActivate: function(req,res,api){
        var api = defaultVars(api);
        async.waterfall([
        function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
        },
        function(done) {
        User.findByEmailToken(req.body.email,token, function(err, token, account) {
          if (err) {
              req.flash('error', " No account with that email was found");
                var errorParam = {error: true, message: req.flash('error')};
                var params = { uri: 'back',params: {}};
                return error(err,api, errorParam, params);
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
          from: configAuth.emailFrom,    //change from
          subject: configAuth.app.name +'Activation email', //change the subject
          template: 'accountConfirmation',
          context: {
            host: req.headers.host
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
            if (err) {
                var errorParam = {error: true, message: req.flash('error')};
                var params = { uri: 'user/activate',params: {expressFlash: req.flash("error")}};
                return error(err,api, errorParam, params);
            }
            else
            {
            if (api) {
                return res.json({expressFlash: req.flash("success")})
            }
            else
                return res.render('user/activate', {expressFlash: req.flash("success")});
            }

        });
    },
    /**
     * [forgotePass send a pass recovery email]
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @param  {[Boolean]} api [if api call then pass true otherwise false]
     * @return {[type]}     [json if api or rendering a page]
     */
    forgotePass: function(req, res, api) {
        var api = defaultVars(api);
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
                        var errorParam = {error: true, message: req.flash('error')};
                        var params = { uri: 'forgot',params: {
                           expressFlash : req.flash('error') }};
                        return error(err,api, errorParam, params);
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
                    from: configAuth.emailFrom,    //change from
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
                if (err) {
                    var errorParam = {error: true, message: req.flash('error')};
                    var params = { uri: 'forgot',params: {expressFlash: req.flash("error")}};
                    return error(err,api, errorParam, params);
                }
                if (api) 
                {
                    return res.json({expressFlash: req.flash("success")})
                }
                else
                {
                    return res.render('forgot', {expressFlash: req.flash("success")});
                }
              });        
                
    },

    resetPass: function(req, res, api) {
        var api = defaultVars(api);
        async.waterfall([
        function(done) {
          User.resetPassword(req.params.token, req.body.password, function (err, user) {
            if (err) {
                req.flash('error',"Token was invalid");
                var errorParam = {error: true, message: req.flash('error')};
                var params = { uri: 'back',params: {}};
                return error(err,api, errorParam, params);
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
            from: configAuth.emailFrom,
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
            if (err) {
                var errorParam = {error: true, message: req.flash('error')};
                var params = { uri: '/',params: {}};
                return error(err,api, errorParam, params,true);
            }
            else
            {
            if (api) {
                return res.json({expressFlash: req.flash("success")})
            }
            else
                return res.redirect('/');
            }
        });
    }

};