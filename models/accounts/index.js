var User = require('./account');
var Image = require('../images/index');
var debug = require('debug')('accounts');
var fields= ["email","bio"]; 
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
	/*
	TODO set a default pic
	*/
	create: function (req, cb) {
		var newUser = new User({ username : req.body.username, email: req.body.email });
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
		var newFields={};
		var options = {new: true};
		//add fields that are in req.body aka from form
		//so that we can update those if they are not in the object
		//or just update
		for (var i = 0; i < fields.length; i++) {
			if(req.body[fields[i]].trim())
			{
				newFields[fields[i]]=req.body[fields[i]].trim();
			}
		};
        if ('file' in req) 
        {
        	//doing save inside Image since its async
        	Image.create(req,function (err,newImage) {
        		newFields["image"]=newImage._id;
		      	User.findOneAndUpdate({_id: req.user._id}, newFields,options, function(err, user) {
	                if(err) {
	                    cb(err);
	                }
	                cb(null,user);
	            });
        	});
        }
        else
        {
	      	User.findOneAndUpdate({_id: req.user._id}, newFields,options, function(err, user) {
	            if(err) {
	                cb(err);
	            }
	            cb(null,user);
	        });
        }
	},
	putPass: function(id,pass,cb) {
		User.findById(id ,function(err, user){
		 	if (err) {
		 		cb(err);
		 	};
		    if (user){
		        user.setPassword(pass, function(){
		            user.save();
		            cb(null);
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