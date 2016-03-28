var Element = require('./element');
var Clipping = require('../clippings/index');
var Q = require('q'),
	async = require("async"),
	underscore = require("underscore");
var elementFields = ["type", "z_index", "center", "height", "destination",
"width", "locked","created_on", "last_modified"];

var clippingTypes = [
	"svg_clipping",
	"annotation",
	"html_clipping",
	"image_clipping",
	"text_clipping",
	"text_selfmade",
	"text_clipping",
	"image_selfmade",
	"image_clipping",
	"video_clipping",
	"audio_clipping",
	"mache_clipping",
	"frame_selfmade",
	"map_clipping",
	"doc_clipping"
];

//function to do a deep compare since normal compare dosn't return true
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
 * retrieveFields goes through elementFields and checks if
 * element has that field if it does assigns it to newElement
 * @param  {[type]} newElement [doc model]
 * @param  {[type]} element    [object that contains the keys in elementFields]
 * @return {[type]}            [none]
 */
function retrieveFields (newElement, element) {
	if (element == null) {return;}
	//import top level fields for element
	for (var i = 0; i < elementFields.length; i++) {
		if(typeof element[elementFields[i]] !== 'undefined')
		{
			if (elementFields[i] === "created_on" ||
				elementFields[i] === "last_modified") {
				newElement[elementFields[i]] = new Date(element[elementFields[i]]);
			}
			else
				newElement[elementFields[i]] = element[elementFields[i]];
		}
	}
}

/**
 * [migrateCreate takes an old element and returns an mongo doc element]
 * @param  {[type]} element 	    [description]
 * @param  {[type]} clippings       [an array full of  all clippings]
 * @param  {[type]} arrayOfMetadata [an array full of all clipping docs]
 * @param  {[function]} cb          [a callback function]
 * @return {[model]}                [a mongo element doc]
 */
function migrateCreate (element, clippings, arrayOfMetadata, cb) {
	var deferred = Q.defer();
	var newElement = new Element();

	retrieveFields(newElement,element);

	//transforms
	newElement.transforms = element.transforms;

	//children for groups and such
	newElement.children = element.children;

	var ElemClip= getClip(element);

	//create an array with just elems and look for one equal to elem
	//return index of that elem if found or -1 if not
	var index = underscore.chain(clippings)
		        .map(function(value){ return value.elem;})
		        .deepIndex(ElemClip.elem)
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
 * [getMetaData retrieve metadata element aka clipping from element]
 * @param  {[type]} element [a mache compositon_element]
 * @return {[object]}       [key: nameOfClipping , elem: clipping]
 */
function getClip(element){

	for (var i = 0; i < clippingTypes.length; i++) {
		if(clippingTypes[i] in element)
		{
			return {key: clippingTypes[i] ,elem: 
				{[clippingTypes[i]] : element[clippingTypes[i]]}};
		}
	};

	return  {key: null, elem: null };
}

/**
 * findById returns Element By Id
 * @param  {[type]}   id       [Element mongoose Id]
 * @param  {Function} cb       [callback function]
 * @return {[err]} err         [Error]
 * @return {[doc]} element     [Element Doc]
 */
function findById(id,cb){
	Element.findById(id,function(err,element){
		if (err) {
			cb(err);
		}
		cb(null,element);
	})
}

/**
 * filter check if all keys in object are legal fields
 * @param  {[type]} elementValues    [Object  that contains members of
								      Key value pairs with key being changed and new value
								      { center: 10,10
								      } ]
 * @return {[Object]} filteredObject [object that has values already fitlered]
 */
function filter(elementValues){
	var keys = Object.keys(elementValues);
	var filterEdits = keys.filter(function(value,i){
		if (elementFields.indexOf(value) > -1) value;
	});
	var filteredObject = {};
	for (var i = 0; i < filterEdits.length; i++) {
		filteredObject[filterEdits[i]] = elementValues[filterEdits[i]];
	};
	return filteredObject;
}
module.exports = {
	/**
	 * oldMultiCreate creats the a list of multiple elements holding the id using
	 * using old api format
	 * @param  {[type]} objectMache 	    [the mache object]	
	 * @param  {[function]} cb              [callback function]	
	 * @return {[err]} err                  [an error]
	 * @return {[array]} listOfElements     [an array of doc ids of elements]
	 */
	oldMultiCreate: function(objectMache, cb) {
		var clippings = [];
		var modelclippings = [];
		//create a list of all unique clippings
		var metadataEElements = objectMache.composition_space;
		for (var i = 0; i < metadataEElements.children.length; i++) {
			var metadata =getClip(metadataEElements.children[i].composition_element);
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
	},

	create: function(values,cb){
		values= (values != null) ? filter(values) : null;
		var newElement = new Element();
		retrieveFields(newElement,values);
		newElement.save(function(err, element) {
            if(err) {
                cb(err);
            }
            cb(null,element);
	   	});
	},
	edit: function(id,edits,cb){
		var filterEdits = filter(edits);
		Element.findByIdAndUpdate(id, 
			{ $set: filterEdits}, function (err, element) {
		  	if (err) cb(err);
		  	cb(null,elment);
		});
		
	},
	delete: function(id,cb){
		Element.remove({
			_id: id
		},function(err){
			if (err) {
				cb(err);
			}
		});
	}

};