var Game = require('./game');
module.exports = {
	create: function (req, cb) {
		var newGame = new Game();
	 	newGame.name = req.body.name;
        newGame.desc = req.body.desc;
        newGame.coop = req.body.coop;
        newGame.save(function(err, newGame) {
            if(err) {
                cb(err);
            }
            cb(null, newGame);
        });
	}, //close create
	get: function (id, cb) {
		Game.findById(id, function(err, game) {
            if(err) {
                cb(err);
            }
          cb(null, game);
        });
	},
	all: function (cb) {
		Game.find(function(err, games) {
            if(err) {
                cb(err);
            }
          cb(null, games);
        });
	},
	put: function (req, cb) {
		Game.findById(req.params.id, function(err, game) {
            if(err) {
                cb(err);
            }
	      	game.name = req.body.name;
	        game.desc = req.body.desc;
	        game.coop = req.body.coop;
            game.save(function(err, game) {
                if(err) {
                    cb(err);
                }
                cb(null,game);
            });
        });
	},
	delete: function (id, cb) {
		  Game.remove({
            _id: id
        }, function(err) {
            if(err) {
                cb(err);
            }
        });
	}
} 