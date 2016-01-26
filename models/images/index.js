var Image = require('./image');

var imageFields = ["fieldname", "originalname", "encoding", "mimetype", "destination",
 "filename", "path", "size"];
module.exports = {
	create: function (req, cb) {
		var newImage = new Image();
        //go through array fields which are the fields that are
        //given from mutler and are part of the schema
        for (var i = 0; i < imageFields.length; i++) {
             newImage[imageFields[i]] = req.file[imageFields[i]];
         };
        newImage.save(function(err, image) {
            if(err) {
                req.flash('error', "Error Creating Image");  
                cb(err);
            }
            cb(null, image);
        });
	}, //close create
	get: function (id, cb) {
		Image.findById(id, function(err, image) {
            if(err) {
                cb(err);
            }
            if (!image) {
                var error= new Error("Image not found");
                error.type="image";
                error.http_code = 404;
                error.arguments ={id: id};
                error.message="Image not found";
                cb(error);
            }
          cb(null, image);
        });
	},
	all: function (cb) {
		Image.find(function(err, images) {
            if(err) {
                cb(err);
            }
          cb(null, images);
        });
	},
	put: function (req, cb) {
		Image.findById(req.params.id, function(err, image) {
            if(err) {
                cb(err);
            }
            //go through array fields which are the fields that are
            //given from mutler and are part of the schema
            for (var i = 0; i < imageFields.length; i++) {
                 newImage[imageFields[i]] = req.file[imageFields[i]];
             };
            image.save(function(err, image) {
                if(err) {
                    cb(err);
                }
                cb(null,image);
            });
        });
	},
	delete: function (id, cb) {
		  Image.remove({
            _id: id
        }, function(err) {
            if(err) {
                cb(err);
            }
        });
	}
} 