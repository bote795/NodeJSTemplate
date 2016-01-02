var express = require('express');
var router = express.Router();
var Game = require('../models/game');

router.route('/games')
    .get(function(req, res) {
        Game.find(function(err, data) {
            if(err) {
                return res.send(500, err);
            }
            return res.send(data);
        });
    })
    .post(function(req, res) {
        var newGame = new Game();
        newGame.name = req.body.name;
        newGame.desc = req.body.desc;
        newGame.coop = req.body.coop;
        newGame.save(function(err, newGame) {
            if(err) {
                return res.send(500, err);
            }
            return res.json(newGame);
        });
    });

router.route('/games/:id')
    .put(function(req, res) {
        Game.findById(req.params.id, function(err, game) {
            if(err) {
                res.send(err);
            }
	      	game.name = req.body.name;
	        game.desc = req.body.desc;
	        game.coop = req.body.coop;
            game.save(function(err, game) {
                if(err) {
                    res.send(err);
                }
                //res.json(game);
                res.redirect('./group')
            });
        });
    })
    .get(function(req, res) {
        Game.findById(req.params.id, function(err, game) {
            if(err) {
                res.send(err);
            }
            res.render('./game/edit', { view : { put: true, action: "/games/"+game._id}, game: game });
       		//res.json(game);
        });
    })
    .delete(function(req, res) {
        Game.remove({
            _id: req.params.id
        }, function(err) {
            if(err) {
                res.send(err);
            }
            res.json('Deleted!');
        });
    });

module.exports = router;
