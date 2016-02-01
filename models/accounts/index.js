var User = require('./account');
var Image = require('../images/index');
var debug = require('debug')('accounts');
var fields= ["email","bio","Oldimage","following", "followers"]; 
var mongoose = require('mongoose');

//registers the user so we don't have to re-write this code in create
var subcreate=function (newUser, req,cb) {
	User.register(newUser, req.body.password, function(err, newUser) {
        if (err) {
        	req.flash('error',err.message);
	    	debug(err);
            return cb(err);
        }

        cb(null, newUser);
	});
};
var findByTokenExpire=function (token, cb) {
	  User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          return cb(err);
        }
        cb(null,user);
      });
};
module.exports = {
	/*
	TODO set a default pic
		call to create a new User
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
					{	req.flash("error",err.message);
						return cb(err);
					}
					//saves imadeid to newuser
					newUser.image=newImage._id;
					newUser.avatars=[newImage._id];
					//save user
					newUser.save(function(err, user) {
		                if(err) {
		                    return cb(err);
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
					return cb(err);
				}
				cb(null, newUser);
			});
		}

	}, //close create
	//retrieves one user by id
	get: function (id, cb) {
		User.findById(id, function(err, user) {
            if(err) {
                return cb(err);
            }
          cb(null, user);
        });
	},
	//retrieves all users
	all: function (cb) {
		User.find(function(err, users) {
            if(err) {
                return cb(err);
            }
          cb(null, users);
        });
	},
	/*
		@params request
		@params cb
		OPTIONAL PARAMS
		@params name <true:false> (Custom username lookup)
		@params username (if name true, put username here)
		@params isCustomid <true:false> (different from current user)
		@params isCustomid if customid true (id of different user)

	*/
	put: function (req, cb, name, username, isCustomid, id) {
		var newFields={};
		var name = typeof name !== 'undefined' ? name : false;
		var isCustomid = typeof isCustomid !== 'undefined' ? isCustomid : false;
		var options = {new: true};
		//add fields that are in req.body aka from form
		//so that we can update those if they are not in the object
		//or just update
		for (var i = 0; i < fields.length; i++) {
			if(fields[i] in req.body)
			if(req.body[fields[i]].trim())
			{
				//if an oldImage avatar is choosen then lets save that as new
				//display pic instead convertId to objectId
				if ("Oldimage" == fields[i] ) {
					newFields["image"]=	
					mongoose.Types.ObjectId(req.body[fields[i]]);
				}
				else if ("followers" == fields[i]  || 
					"following" == fields[i]) {
					newFields["$push"]={
						[fields[i]] : mongoose.Types.ObjectId(req.body[fields[i]])
					}
				}
				else
					newFields[fields[i]]=req.body[fields[i]].trim();
			}
		};
		var findBy={};
		if (name) {
			findBy = {username: username};
		}
		else if (isCustomid) {
			findBy = {_id: id};	
		}
		else
		{
			findBy = {_id: req.user._id};
		}
		//if a file is being passed
		//create file then save it along with other fields
        if ('file' in req) 
        {
        	//doing save inside Image since its async
        	Image.create(req,function (err,newImage) {
        		newFields["image"]=newImage._id;
        		newFields["$push"]={avatars: newImage._id};
		      	User.findOneAndUpdate(findBy, newFields,options, function(err, user) {
	                if(err) {
	                    return cb(err);
	                }
	                cb(null,user);
	            });
        	});
        }
        //no file was sent just update other fields
        else
        {
	      	User.findOneAndUpdate(findBy, newFields,options, function(err, user) {
	            if(err) {
	                return cb(err);
	            }
	            cb(null,user);
	        });
        }
	},
	/*
		update pasword
		user.setPassword calls passport password to hash and salt
	*/
	putPass: function(id,pass,cb) {
		User.findById(id ,function(err, user){
		 	if (err) {
		 		return cb(err);
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
                return cb(err);
            }
        });
	},
	//functions for recovery pass
	/*
		Function to find by email and set new Token
	*/
	findByEmailToken: function(email, token, cb) {
      User.findOne({ email: email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot', { expressFlash : req.flash('error')});
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          cb(err, token, user);
        });
      });
	},
	findByTokenExpire: findByTokenExpire,

	resetPassword: function (token, password, cb) {
		findByTokenExpire(token,function (err,user) {
			if (err) {
				return cb(err);
			}
			user.setPassword(password, function () {
	            user.resetPasswordToken = undefined;
	            user.resetPasswordExpires = undefined;

	            user.save(function(err) {
	            	if (err) {
	            		return cb(err);
	            	};
	                cb(null,user);
	              });
            });
        });
	},
	//retrieves one user by id
	getUsers: function (id,type, cb) {
		User.findOne({username: id}).populate(type).exec(function(err, user) {
            if(err) {
                return cb(err);
            }
          cb(null, user);
        });
	}
} 