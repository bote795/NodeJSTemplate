var Element = require('./element');
var Clipping = require('../clippings/index');
var Q = require('q'),
	async = require("async"),
	underscore = require("underscore");
var elementFields = ["type", "z_index", "center", "height", "destination",
"width", "locked","created_on", "last_modified"];

//function to do a deep compare since normal compare dosn't work
underscore.mixin({
  'deepIndex': function (array, item) {
    var result = -1;
    underscore.some(array, function (value, index) {
      if (underscore.isEqual(value, item)) {
        result = index;
        return true;
      }
    });
    return result;
  }
});
/**
 * [migrateCreate takes an old clip and returns a clipping id]
 * @param  {[type]} element [description]
 * @return {[type]}            [description]
 */
function migrateCreate (element, clippings, arrayOfMetadata, cb) {
	var deferred = Q.defer();
	var newElement = new Element();
	var temp = element;
		//import top level fields for clipping
		for (var i = 0; i < elementFields.length; i++) {
			if(typeof element[elementFields[i]] !== 'undefined')
			{
				if (elementFields[i] === "created_on" ||
					elementFields[i] === "last_modified") {
					newElement[elementFields[i]] = new Date(element[elementFields[i]]);
				}
				else
					newElement[elementFields[i]] = element[elementFields[i]];
				delete temp[elementFields[i]];
			}
		}

		//transforms
		newElement.transforms = element.transforms;

		//children for groups and such
		newElement.children = element.children;

		delete temp["transforms"];
		delete temp["children"];
		
		//try to find clipping
		var keys = Object.keys(temp);
		if (keys > 1) {
			console.log("has more than 1 key left");
			deferred.reject(new Error("has more than 1 key left"));
		};
		//create an array with just elems and look for one equal to elem
		//return index of that elem if found or -1 if not
		var index = underscore.chain(clippings)
			        .map(function(value){ return value.elem;})
			        .deepIndex(element)
			        .value();
		if (index == -1 ) {
			deferred.reject(Error("clipping not found"));
		};	        
		//use that index for the index of metedata docs
		newElement.clipping = arrayOfMetadata[index]._id;	
		newElement.save(function(err, element) {
            if(err) {
                //cb(err);
                deferred.reject(err);
            }
            //cb(null,element);
            deferred.resolve(element);
	   	});
	return deferred.promise;
}


/**
 * [getMetaData retrieve metadata element aka clipping from element since metadata isn't always same
 * have to find it using a different method]
 * @param  {[type]} element [description]
 * @return {[type]}         [description]
 */
function getMetaData(element){
	//remove all fields that we know exist in that element to be 
	//able to retrieve field that we don't know name of
	for (var i = 0; i < elementFields.length; i++) {
			if(typeof element[elementFields[i]] !== 'undefined')
			{
				delete element[elementFields[i]];
			}
		}
	delete element["transforms"];
	delete element["children"];
	
	//try to find clipping
	var keys = Object.keys(element);
	if (keys > 1) {
		console.log("has more than 1 key left");
	};
	return {key: keys[0] ,elem: element};
}
module.exports = {
	/**
	 * oldMultiCreate creats the a list of multiple elements holding the id using
	 * using old api format
	 * @param  {[type]} objectMache 	[the mache object]	
	 * @param  {[type]} tempMache       [the temp mache object]	
	 * @param  {[type]} cb              [callback function]	
	 * @return {[type]} cb              [an array of ids]
	 */
	oldMultiCreate: function(objectMache, tempMache, cb) {
		var clippings = [];
		var modelclippings = [];
		//create a list of all unique clippings
		var metadataEElements = tempMache.composition_space;
		for (var i = 0; i < metadataEElements.children.length; i++) {
			var metadata =getMetaData(metadataEElements.children[i].composition_element);
			//if not found add to array
			if (clippings.indexOf(metadata) ===  -1) {
				clippings.push(metadata);
				modelclippings.push(Clipping.migrationCreate(metadata));
			}
		}
		
		async.waterfall([
			function(callback) {
				//insert all clips into db and retrieve docs with ids
				//insertmany keeps order so can use index to match them later
				Clipping.migrationInsertMany(modelclippings,function(err,arrayOfClips){
					callback(err,arrayOfClips)
				});
			},
			function(arrayOfClips , callback){
				var listOfElements = [];
				var promises = [];
				var elements = objectMache.composition_space;
				//create promises to create all elements when completed they
				//have created a new object in db
				for (var i = 0; i < elements.children.length; i++) {
					promises.push(
					migrateCreate(elements.children[i].composition_element,
						clippings,arrayOfClips));
				}
				Q.allSettled(promises)
				.then(function(results) {
					var err=null;
					results.forEach(function(result){
				        if (result.state === "fulfilled") {
				            var value = result.value;
				            listOfElements.push(result.value._id);
				        } else {
				            err = result.reason;
				        }
					});
					callback(err, listOfElements);
				});
			}],
			function(err,listOfElements) {
				if (err) {
					return Error(err);
				}
				return cb(null,listOfElements)
			}
		);
	}

};
