var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var Account = new Schema({
    username: String,
    password: String,
    email: String,
    image: { 
     	type: mongoose.Schema.Types.ObjectId, 
     	ref: 'Image'},
    bio: String,
	following: [{userId: String}],
	followers: [{userId: String}]
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
