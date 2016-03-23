var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose);
//Schema.Types.Mixed
var Schema = mongoose.Schema;
var Clipping = new Schema({
	clip: Schema.Types.Mixed
},{strict: false});
Clipping.plugin(deepPopulate);

module.exports = mongoose.model('Clipping', Clipping);