var express = require('express');
var router = express.Router();
var maches = require('../models/maches/index');
router.route('/mache')
	.get(function(req,res){
		res.json("hi");
	})
	.post(function(req,res) {
		var mache = JSON.parse(req.body.mache);
		maches.oldCreate(req.body.mache,function(err,mache){
			if (err)
			{
				res.json(err);
			}
			res.json(mache)
		});
		//res.json("sucess");
	});

router.route('/mache/:id')
	.get(function(req,res) {
		console.log(req.params.id);
		maches.popElement(req.params.id,function(err,mache){
			res.json(mache);
		});
	})

module.exports = router;