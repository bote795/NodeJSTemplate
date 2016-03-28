var Mache = require('./mache');
var Element = require('../elements/index');
var Clipping = require('../clippings/index');
var simpl = require('../../middleware/simplBase.js');

var macheFields = ["title", "description", "visibility", "background_color", "destination",
"hash_key","created_on", "last_modified"];
module.exports = {
	/**
	 * [oldCreate uses old api to create new api mache]
	 * @param  {[type]}   oldFormat [serialized old api mache]
	 * @param  {Function} cb        [callback function]
	 * @return {[type]}             [no return type]
	 */
	migrateCreate: function(oldFormat,cb) {
		oldFormat= (oldFormat != null) ? String(oldFormat) : null;
		if (oldFormat == null) {
			return Error("not String");
		};
		//need mache to get all data
		var objectMache = simpl.graphExpand(JSON.parse(oldFormat));
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
			if (err) {
				cb(err);
			};
			newMache.composition_space.children = listOfIds;
			newMache.save(function(err, mache) {
				if(err){
					cb(err);
				}
				cb(null, mache);
			});
		});
	},
	//do all joins or populations of elements from other collections
	popAll: function (id,cb) {
		Mache
			.findById(id)
			.deepPopulate('composition_space.children composition_space.children.clipping')
			.exec(function(err,mache){
				if(err) cb(err);
				cb(null,mache);
			});
	},
	// converting new format to old
	// need to change get metadata out of children objects
	// into metadata_collection
	convertToOld: function (mache, cb) {
		//mache.composition_space
		//remove clipping mongoDoc and just integrate it to the element
		for (var i = 0; i < mache.composition_space.children.length; i++) {
			var keys =Object.keys(mache.composition_space.children[i].clipping.clip);
			var currentChild = mache.composition_space.children[i];
			for (var j = 0; j < keys.length; j++) {
				currentChild["_doc"][keys[j]]=currentChild.clipping.clip[keys[j]];
			}
			currentChild["_doc"]["clippingId"]=currentChild.clipping._id;
			delete currentChild["_doc"].clipping;
		};
		//old Format had a compostion_space 
		var oldChildrenArray = [];
		var children = mache.composition_space.children;
		for (var i = 0; i < children.length; i++) {
			oldChildrenArray.push( {composition_element: children[i]});
		};
		mache["_doc"]["composition_space"]["children"] = oldChildrenArray;
		cb(null,mache);
	}

};