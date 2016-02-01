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
    avatars : [{ 
     	type: mongoose.Schema.Types.ObjectId, 
     	ref: 'Image'}],
	following: [{type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'}],
	followers: [{type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'}],
	resetPasswordToken: String,
  	resetPasswordExpires: Date
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);