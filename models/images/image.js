var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Image = new Schema({
	fieldname: String,
	originalname: String,
	encoding: String,
	mimetype: String,
	destination: String,
	filename: String,
	path: String,
	size: Number,
	remote: {type: Boolean, required: true, default: false},
	link: String,
    created_at: Date,
  	updated_at: Date
});
//on every save, add the date
Image.pre('save', function(next){
	//get the current date
	var currentDate = new Date();
	//change the udpated_at field to current date
	this.updated_at = currentDate;

	//if created_at doesn't exist, add to the field
	if(!this.created_at)
		this.created_at = currentDate;

	next();
});
module.exports = mongoose.model('Image', Image);
	
