var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var Account = new Schema({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	password: String,
    image: { 
     	type: mongoose.Schema.Types.ObjectId, 
     	ref: 'Image'},
    bio: String,
	following: [{userId: String}],
	followers: [{userId: String}],
	resetPasswordToken: String,
  	resetPasswordExpires: Date
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
