var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var playerRecord = new Schema({
  	won: Boolean,
  	playedBy: {
  		type: mongoose.Schema.Types.ObjectId,
  		ref: 'Account'
  	},
  	group: {
  		type: mongoose.Schema.Types.ObjectId,
  		ref: 'Group'
  	},
  	game: {
  		type: mongoose.Schema.Types.ObjectId,
  		ref: 'Game'
  	},
  	created_at: Date,
  	updated_at: Date,
});
//on every save, add the date
playerRecord.pre('save', function(next){
	//get the current date
	var currentDate = new Date();
	//change the udpated_at field to current date
	this.updated_at = currentDate;

	//if created_at doesn't exist, add to the field
	if(!this.created_at)
		this.created_at = currentDate;

	next();
});
module.exports = mongoose.model('playerRecord', playerRecord);
