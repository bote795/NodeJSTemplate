var Mache = require('mache');

var macheFields = ["title", "description", "visibility", "background_color", "destination",
"created_on", "last_modified"];
module.exports = {
	oldCreate = function(oldFormat) {
		oldFormat (oldFormat != null) ? String(value) : null;
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
					newMache[macheFields[i]] = new Date(newMache[macheFields[i]]);
				}
				else
					newMache[macheFields[i]] = objectMache[macheFields[i]];
			}
		};
		//TODO: create user and link mache
		
		//retrieve thumbnail
		newMache.thumbnail.location = objectMache.thumbnail.location;

	}

};