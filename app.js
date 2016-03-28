var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require ('passport-local').Strategy;
var methodOverride = require('method-override');
var hbs = require('hbs');
var routes = require('./routes/users');
var images = require('./routes/images');
var maches = require('./routes/mache');
var flash = require('express-flash');
var configAuth = require('./config/auth');
var mongo_express = require('mongo-express/lib/middleware');
var mongo_express_config = require('./config/mongo_express_config');
var app = express();
// load the auth variables
// view engine setup
app.engine('html', hbs.__express);
app.set('view engine', 'hbs');
//express automatically adds layout for all the webpages surfed

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
//to be able use PUT and DELETE  in forms
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

app.use(cookieParser());
app.use(require('express-session')({
    secret: configAuth.secret, // should be put in env variable
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/mongo_express', mongo_express(mongo_express_config));

app.use('/api/v1', maches);
app.use('/', routes);
app.use('/', images);
//adds local, facebook,
require('./config/passport')(passport);

//mongoose
mongoose.connect(configAuth.db);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    /*
      to be able to catch mongoose errors which are usually
      query errors about email duplication
    */
    if (err.code == 11000) {
        req.flash('error',"A user with the given email is already registered"); 
        res.render('login',{expressFlash:req.flash('error')})
        return;
    };
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  /*
    to be able to catch mongoose errors which are usually
    query errors about email duplication
  */
  if (err.code == 11000) {
      req.flash('error',"A user with the given email is already registered"); 
      res.render('login',{expressFlash:req.flash('error')})
      return;
  };
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
