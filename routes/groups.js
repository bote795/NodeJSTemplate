var express = require('express');
var router = express.Router();
var Group = require('../models/groups/index');
var hbs = require('hbs')
  , fs = require('fs')
  , middleware = require('../middleware/authentication')
  , form = fs.readFileSync(__dirname + '/../views/group/_form.hbs', 'utf8');
hbs.registerPartial('formPartial', form); 
router.use(middleware.isAuthenticated);

router.route('/groups')
    .get(function(req, res) {
        Group.all(function(err, data) {
            if(err) {
                return res.send(500, err);
            }
            return res.send(data);
        });
    })
    .post(function(req, res) {
        Group.create(req, function(err, newGroup) {
            if(err) {
                return res.send(500, err);
            }
            //return res.json(newGroup);
            res.render('./group/', {group: newGroup});
        });
    });
router.route('/groups/new')
    .get(function(req, res) {       
        res.render('./group/new', { view : { put: false, action: "/groups"}, group: false});
    })
router.route('/groups/:id/edit')
    .get(function(req, res) {
        Group.get(req.params.id, function(err, group) {
            if(err) {
                res.send(err);
            }
            res.render('./group/edit', 
            { view : { put: true, action: "/groups/"+group._id}, 
            group: group });
            //res.json(game);
        });
    })
router.route('/groups/:id')
    .put(function(req, res) {
        Group.put(req, function(err, group) {
            if(err) {
                res.send(err);
            }
                res.render('./group',{ group: group})
        });
    })
    .get(function(req, res) {
        Group.get(req.params.id, function(err, group) {
            if(err) {
                res.send(err);
            }
            console.log(group);
            res.render('./group/', { group: group});
       		//res.json(game);
        });
    })
    .delete(function(req, res) {
        Group.delete(req.params.id, function(err) {
            if(err) {
                res.send(err);
            }
            res.json('Deleted!');
        });
    });

module.exports = router;
