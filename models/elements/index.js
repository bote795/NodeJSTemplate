var Element = require('./element');
var Clipping = require('../clippings/index');
var Q = require('q');
var elementFields = ["type", "z_index", "center", "height", "destination",
"width", "locked","created_on", "last_modified"];
/**
 * [oldCreate takes an old clip and returns a clipping id]
 * @param  {[type]} singleClip [description]
 * @param  {array}  metadata   [description]
 * @return {[type]}            [description]
 */
function oldCreate (singleClip, metadata, cb) {
	var deferred = Q.defer();
	var newElement = new Element();

		//import top level fields for clipping
		for (var i = 0; i < elementFields.length; i++) {
			if(typeof singleClip[elementFields[i]] !== 'undefined')
			{
				if (elementFields[i] === "created_on" ||
					elementFields[i] === "last_modified") {
					newElement[elementFields[i]] = new Date(singleClip[elementFields[i]]);
				}
				else
					newElement[elementFields[i]] = singleClip[elementFields[i]];
			}
		}

		//transforms
		newElement.transforms = singleClip.transforms;

		//children for groups and such
		newElement.children = singleClip.children;

		//try to find clipping
		var keys = Object.keys(singleClip);
		var clippingKey= {};
		for (var i = 0; i < keys.length; i++) {
			if (typeof singleClip[keys[i]]["simpl.ref"] !== 'undefined')
			{
				clippingKey.name = keys[i];
				clippingKey.id = singleClip[keys[i]]["simpl.ref"];
				break;
			}
		}
		var clipId;
		//find clipping data belonging to that element
		for (var i = 0; i < metadata.length; i++) {
			if(typeof metadata[i][clippingKey.name] !== 'undefined')
			{
				if (metadata[i][clippingKey.name]["simpl.id"] 
					=== clippingKey.id) 
				{
					delete metadata[i][clippingKey.name]["simpl.id"];
					clipId = i;
					break;
				}
			}
		};
		Clipping.oldCreate(clippingKey.name,metadata[clipId],function(err,clip){
			if (err) {
				//cb(err);
				deferred.reject(err);
			}

			newElement.clipping = clip._id;	
			newElement.save(function(err, element) {
	            if(err) {
	                //cb(err);
	                deferred.reject(err);
	            }
	            //cb(null,element);
	            deferred.resolve(element);
	        });
		});
	return deferred.promise;
}

module.exports = {
	/**
	 * [oldMultiCreate creats the a list of multiple elements holding the id]
	 * @param  {[type]} objectMache [an array of elements]
	 * @return {[type]}             [an array of ids]
	 */
	oldMultiCreate: function(objectMache,cb) {
		var listOfElements = [];
		var promises = [];
		var elements = objectMache.composition_space;
		for (var i = 0; i < elements.children.length; i++) {
			promises.push(
			oldCreate(elements.children[i].composition_element,
				objectMache.metadata_collection));
		}
		Q.allSettled(promises)
		.then(function(results) {
			results.forEach(function(result){
		        if (result.state === "fulfilled") {
		            var value = result.value;
		            listOfElements.push(result.value._id);
		        } else {
		            var reason = result.reason;
		        }
			});
			cb(null, listOfElements);
		})


	}

};
