var User = require('./account');
var Image = require('../images/index');
var debug = require('debug')('accounts');
//registers the user so we don't have to re-write this code in create
var subcreate=function (newUser, req,cb) {
	User.register(newUser, req.body.password, function(err, newUser) {
        if (err) {
	    console.log(err);
            cb(err);
        }

        cb(null, newUser);
	});
};
module.exports = {
	create: function (req, cb) {
		var newUser = new User({ username : req.body.username });
		//if passing image when registering
		if ('file' in req) 
		{
			debug(req.file)
			debug("image found");
			//create image so we can get Id and pass it to user
			Image.create(req,function (err,newImage) {
				debug("Image created");
				subcreate(newUser,req,function (err,newUser) {
					if (err) 
					{
						cb(err);
					}
					//saves imadeid to newuser
					newUser.image=newImage._id;
					//save user
					newUser.save(function(err, user) {
		                if(err) {
		                    cb(err);
		                }
		                cb(null,user);
		            });
				});
			});
		}
		//if image is not being passed then just register user
		else
		{
			debug("image not found");
			subcreate(newUser,req,function (err,newUser) {
				if (err) 
				{
					cb(err);
				}
				cb(null, newUser);
			});
		}

	}, //close create
	get: function (id, cb) {
		User.findById(id, function(err, user) {
            if(err) {
                cb(err);
            }
          cb(null, user);
        });
	},
	all: function (cb) {
		User.find(function(err, users) {
            if(err) {
                cb(err);
            }
          cb(null, users);
        });
	},
	put: function (req, cb) {
		User.findById(req.params.id, function(err, user) {
            if(err) {
                cb(err);
            }
	      	user.username = req.body.username;
	        user.email = req.body.email;
	        user.bio = req.body.bio;
            user.save(function(err, user) {
                if(err) {
                    cb(err);
                }
                cb(null,user);
            });
        });
	},
	delete: function (id, cb) {
		  User.remove({
            _id: id
        }, function(err) {
            if(err) {
                cb(err);
            }
        });
	}
} 