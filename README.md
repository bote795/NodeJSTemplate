#GameRecords

#Project Information 

##Goal
Project that will allow users to create groups and register games to keep win and lose ratios.
Pratice using Mango, Express, Node, Handlebars and passport.


##Description
Project that will allow users to create groups and register games to keep win and lose ratios.
Will utilize  Mango, Express, Node, Handlebars, and passport.


Project Strucutre:
```
project
│   README.md
│   file001.txt    
│
│
└───bin
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
└───models
    │
    ├───accounts
    │   accounts.js  -- contains the mongoose schema
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