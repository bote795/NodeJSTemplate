var express = require('express');
var router = express.Router();
var Group = require('../models/group');

router.route('/groups')
    .get(function(req, res) {
        Group.find(function(err, data) {
            if(err) {
                return res.send(500, err);
            }
            return res.send(data);
        });
    })
    .post(function(req, res) {
        var newGroup = new Group();
        newGroup.name = req.body.name;
        newGroup.desc = req.body.desc;
        newGroup.coop = req.body.coop;
        newGroup.save(function(err, newGroup) {
            if(err) {
                return res.send(500, err);
            }
            return res.json(newGroup);
        });
    });

router.route('/group/:id')
    .put(function(req, res) {
        Group.findById(req.params.id, function(err, group) {
            if(err) {
                res.send(err);
            }
	      	group.name = req.body.name;
	        group.desc = req.body.desc;
	        group.coop = req.body.coop;
            group.save(function(err, group) {
                if(err) {
                    res.send(err);
                }
                //res.json(group);
                res.render('./group',group)
            });
        });
    })
    .get(function(req, res) {
        Group.findById(req.params.id, function(err, group) {
            if(err) {
                res.send(err);
            }
            res.render('./group/edit', { view : { put: true, action: "/groups/"+group._id}, game: game });
       		//res.json(game);
        });
    })
    .delete(function(req, res) {
        Group.remove({
            _id: req.params.id
        }, function(err) {
            if(err) {
                res.send(err);
            }
            res.json('Deleted!');
        });
    });

module.exports = router;
