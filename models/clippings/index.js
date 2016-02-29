var Clipping = require('./clipping');

module.exports = {
	oldCreate: function(name,object,cb){
		var newClipping = new Clipping({ [name]: object[name]});
		newClipping.save(function(err, clip){
            if(err) {
                cb(err);
            }
            cb(null,clip);
		});
	}
};
