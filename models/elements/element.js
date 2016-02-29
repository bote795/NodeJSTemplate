var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var Schema = mongoose.Schema;
var Element = new Schema({
	type: String,
    z_index: Number,
    center: String,
    height: Number,
    width: Number,
    transforms: [
    	{}
    ], 
    clipping: {
    	type: mongoose.Schema.Types.ObjectId, 
		ref: 'Clipping'
    },
    //groups of elements if element is dervied for a bigger group
    children: [
    	{}
    ],
    locked: Boolean,
    created_on: Date,
  	last_modified: Date
});
//on every save, add the date
Element.pre('save', function(next){
	//get the current date
	var currentDate = new Date();
	//change the udpated_at field to current date
	this.last_modified = currentDate;

	//if created_on doesn't exist, add to the field
	if(!this.created_on)
		this.created_on = currentDate;

	next();
});
Element.plugin(deepPopulate);

module.exports = mongoose.model('Element', Element);
