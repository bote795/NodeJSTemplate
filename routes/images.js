var express = require('express');
var router = express.Router();
var Image = require('../models/images/index');
var fs = require('fs');
var PUBLIC_PATH =__dirname + '/../public/uploads/';
router.route('/images')
    .get(function(req, res) {
       Image.all(function (err, images) {
        if (err) {
            res.send(err);
        };
           res.send(images);
       })
    })
    .post(function(req, res) {
        Image.create(req,function(err, newImage) {
            if(err) {
                return res.send(500, err);
            }
            return res.json(newImage);
        });
    });
router.route('/images/:id')
    .get(function(req, res) {
        Image.get(req.params.id, function(err, image) {
            if(err) {
                res.send(err);
            }
            if (image.remote) {
                return res.redirect(image.link);
            }
            res.setHeader('Content-Type', image.mimetype)
            var filePath = image.path;
            fs.createReadStream(filePath).pipe(res);
 
        });
    })
    .delete(function(req, res) {
        Image.get(req.params.id, function(err, image) {  
            if (err) {
                res.send(err);
            }         
            fs.unlinkSync(image.path);
          Image.delete(req.params.id, function(err){
            if (err) {
                res.send(err);
            }
            
            res.json('Deleted!');
          });
            
       });
    });
//if ever wanted to download
//res.download('/path/to/file.ext', 'newname.ext');
module.exports = router;
