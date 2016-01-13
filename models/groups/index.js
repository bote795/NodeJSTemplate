var Group = require('./group');
module.exports = {
	create: function (req, cb) {
	    var newGroup = new Group();
        newGroup.name = req.body.name;
        newGroup.desc = req.body.desc;
        newGroup.coop = req.body.coop;
        newGroup.save(function(err, newGroup) {
            if(err) {
                cb(err);
            }
            cb(null, newGroup);
        });
	}, //close create
	get: function (id, cb) {
		Group.findById(id, function(err, group) {
            if(err) {
                cb(err);
            }
          cb(null, group);
        });
	},
	all: function (cb) {
		Group.find(function(err, groups) {
            if(err) {
                cb(err);
            }
          cb(null, groups);
        });
	},
	put: function (req, cb) {
		Group.findById(req.params.id, function(err, group) {
            if(err) {
                cb(err);
            }
	      	group.name = req.body.name;
	        group.desc = req.body.desc;
	        group.coop = req.body.coop;
            group.save(function(err, group) {
                if(err) {
                    cb(err);
                }
                cb(null,group);
            });
        });
	},
	delete: function (id, cb) {
		  Group.remove({
            _id: id
        }, function(err) {
            if(err) {
                cb(err);
            }
        });
	}
} 