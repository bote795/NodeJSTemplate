var Clipping = require('./clipping');

module.exports = {
	migrationCreate: function(object){
		var newClipping = new Clipping();
		newClipping.clip = object.elem;
		return newClipping;
	},
	migrationInsertMany: function (arrayofClippings,cb) {
		Clipping.insertMany(arrayofClippings, function(err, arrayOfDocs ){
			if (err) {
				cb(err);
			}
			cb(null,arrayOfDocs);
		})

	},
	oldCreate: function(object,cb){
		var newClipping = new Clipping();
		newClipping.clip = object;
		newClipping.save(function(err, clip){
            if(err) {
                cb(err);
            }
            cb(null,clip);
		});
	},
	create: function(values,cb){
		values= (values != null) ? values : null;
		var newClipping = new Clipping();
		if (values != null) {
			newClipping.clip = values.clip;
		}
		newClipping.save(function(err, clipping) {
            if(err) {
                cb(err);
            }
            cb(null,clipping);
	   	});
	},
	edit: function(cb){

	},
	delete: function(cb){
		Clipping.remove({
			_id: id
		},function(err){
			if (err) {
				cb(err);
			}
		});
	}
};
