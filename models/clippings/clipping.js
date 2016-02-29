var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose);
//Schema.Types.Mixed
var Schema = mongoose.Schema;
var Clipping = new Schema({
	type: Schema.Types.Mixed
},{strict: false});

module.exports = mongoose.model('Clipping', Clipping);
