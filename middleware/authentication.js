module.exports ={
	isAuthenticated : function (req, res, next) {

	    if (req.isAuthenticated())
	    {
	    	if (req.user.accountActivated) {
	    		return next();
	    	}
	    }
	        
	    req.session.returnTo=req.path;
	    // IF A USER ISN'T LOGGED IN, THEN REDIRECT TO Login Page
	    res.redirect('/login');
	}
}
