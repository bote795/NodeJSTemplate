var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Game = new Schema({
    name: String,
    desc: String,
    coop: Boolean,
    created_at: Date,
  	updated_at: Date
});
//on every save, add the date
Game.pre('save', function(next){
	//get the current date
	var currentDate = new Date();
	//change the udpated_at field to current date
	this.updated_at = currentDate;

	//if created_at doesn't exist, add to the field
	if(!this.created_at)
		this.created_at = currentDate;

	next();
};
module.exports = mongoose.model('Game', Game);
