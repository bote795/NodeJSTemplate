var User = require('./account');
var Image = require('../images/index');
var debug = require('debug')('accounts');
module.exports = {
	create: function (req, cb) {
		var newUser = new User({ username : req.body.username });
		//if passing image when registering
		User.register(newUser, req.body.password, function(err, newUser) {
	        if (err) {
		    console.log(err);
	            cb(err);
	        }
	        //save file
	        if ('file' in req) 
	        {
				Image.create(req,function (err,newImage) {
					debug("Image created");
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

	        };
	        cb(null, newUser);
		});
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
	        user.email = req.body.email;
	        user.bio = req.body.bio;
            if ('file' in req) 
            {
            	//doing save inside Image since its async
            	Image.create(req,function (err,newImage) {
            		user.image = newImage._id;
			      	user.save(function(err, user) {
		                if(err) {
		                    cb(err);
		                }
		                cb(null,user);
		            });
            	});
            }
            else
            {
		      	user.save(function(err, user) {
	                if(err) {
	                    cb(err);
	                }
	                cb(null,user);
	            });
            }

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