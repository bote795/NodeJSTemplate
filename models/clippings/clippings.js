var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Clipping = new Schema({
	metadata: {},
    created_on: Date,
  	last_modified: Date
});
//on every save, add the date
Clipping.pre('save', function(next){
	//get the current date
	var currentDate = new Date();
	//change the udpated_at field to current date
	this.last_modified = currentDate;

	//if created_on doesn't exist, add to the field
	if(!this.created_on)
		this.created_on = currentDate;

	next();
});
module.exports = mongoose.model('Clipping', Clipping);
