var Mache = require('./mache');
var Element = require('../elements/index');
var Clipping = require('../clippings/index');

var macheFields = ["title", "description", "visibility", "background_color", "destination",
"created_on", "last_modified"];
module.exports = {
	oldCreate: function(oldFormat,cb) {
		oldFormat= (oldFormat != null) ? String(oldFormat) : null;
		if (oldFormat == null) {
			return;
		};
		var objectMache = JSON.parse(oldFormat);
		objectMache = objectMache.information_composition;
		var newMache = new Mache();

		//import top level fields for mache
		for (var i = 0; i < macheFields.length; i++) {
			if(typeof objectMache[macheFields[i]] !== 'undefined')
			{
				if (macheFields[i] === "created_on" ||
					macheFields[i] === "last_modified") {
					newMache[macheFields[i]] = new Date(objectMache[macheFields[i]]);
				}
				else
					newMache[macheFields[i]] = objectMache[macheFields[i]];
			}
		};
		//TODO: create user and link mache
		
		//retrieve thumbnail
		newMache.thumbnail.location = objectMache.thumbnail.location;

		//element save multi creates
		//inside of it save clippings as well
		//then save mache if no errors
		Element.oldMultiCreate(objectMache ,function(err,listOfIds){
			newMache.elements = listOfIds;
			newMache.save(function(err, mache) {
				if(err){
					cb(err);
				}
				cb(null, mache);
			});
		});
	},
	popElement: function (id,cb) {
		Mache
			.findById(id)
			.deepPopulate('elements elements.clipping')
			.exec(function(err,mache){
				if(err) cb(err);
				cb(null,mache);
			});
	}

};