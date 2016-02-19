#Nodejs Template

#Project Information 

###subGoal startedwith
Project that will allow users to create groups and register games to keep win and lose ratios.
Pratice using Mango, Express, Node, Handlebars and passport.

##Goal
Turned into creating the basics usage for a nodejs based system that has most user basic functionality

##Description
Project that will allow users to create groups and register games.
Will utilize  Mango, Express, Node, Handlebars, and passport.

###Features
* Being able to create a user  
* Edit user information
* Send email notifications with different services including Amazon SES
* Email templates are made with handlebars
* Flash for errors/success messages
* Forgote password
* User verification
* Following users
* User profiles
* Facebook and google Auth
* All authentication is done with Passportjs
* https
* UI admin panel for interacting with mongo console

#### <b> will also come with some routes for groups, and games since was original project</b>


Project Strucutre:
```
project
│   README.md
│     
│
│
└───bin
|   certifications
|   www contains http server
│     
└───views
│   |   index.hbs
|   │   layout.hbs
|   │   error.hbs
|   |   login.hbs
|   | 
|   ├───game
|   │   _form.hbs  --template form used in edit and new
|   │   edit.hbs
|   │   new.hbs
|   |
|   ├───group
|   │   _form.hbs  --template form used in edit and new
|   │   edit.hbs
|   │   new.hbs
|   |   index.hbs  --details of group
|   ├───email
|   |   email templates
|   |
|   |
|   ├───user
|   |   user related routes
|   |
└───config
|   | auth.js   --contains info from authEx.js keys etc
|   | passport.js -- contains different login strategys using passport and welcome email
|
|
└───middleware
|   | authentication.js  contains midleware function to check if user is signed in and activated
|
└───public
|   css/js files that wil be included in views
|
└───views
│   ├───user
|   ├───email
|   ├───game
|   |_form.hbs has form for edit/new
|   |_edit.hbs
|   |_new.hbs
|   |
|   ├───user
|       each function has views that have to do with each views
|
└───models
    │
    ├───accounts
    │   accounts.js  -- contains the mongoose schema
    |   email.js     -- contains functions for sending emails
    │
    └───games
    │   index.js      -- contians functions to call db for games
    │   games.js      -- contains the mongoose shcema
        
    └───groups
    │   index.js      -- contians functions to call db for games
    │   games.js      -- contains the mongoose shcema
```

To be able to run admin system
follow instructions on 
https://github.com/andzdroid/mongo-express
