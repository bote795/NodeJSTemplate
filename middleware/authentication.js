module.exports ={
	isAuthenticated : function (req, res, next) {

	    // do any checks you want to in here

	    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
	    // you can do this however you want with whatever variables you set up
	    if (req.isAuthenticated())
	    {
	    	if (req.user.accountActivated) {
	    		return next();
	    	}
	    }
	        

	    // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
	    res.redirect('/');
	}
}
