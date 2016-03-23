var express = require('express');
var router = express.Router();
var maches = require('../models/maches/index');
var mongoose = require('mongoose');

router.route('/mache')
	.get(function(req,res){
		res.json("hi");
	})
	.post(function(req,res) {
		maches.migrateCreate(req.body.mache,function(err,mache){
			if (err)
			{
				res.json(err);
			}
			res.json(mache)
		});
	});

router.route('/mache/:id')
	.get(function(req,res) {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			res.json({error: 404,message: "id doesnt exist"})
		};
		maches.popAll(req.params.id,function(err,mache){
			mache =maches.convertToOld(mache,function(err,mache){
				res.json(mache);
			});
		});
	})

module.exports = router;