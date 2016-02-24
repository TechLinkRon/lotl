var lotl_api = require('../lotl_api.js');

// index page 
exports.index = function (req, res) {
	
		res.render('pages/index', {});
};

// login page 
exports.login = function (req, res) {
	
		res.render('pages/login', { message: [] });
};

exports.newhome = function (req, res) {
	exports.homer(req, res, "newhome");
};

exports.home = function (req, res) {
	exports.homer(req, res, "home");
};

exports.homer = function (req, res, pageToReturn) {
	
	var userId = null;
	var clientId = 1;
	var authToken = req.authToken;
    
	pageToReturn = pageToReturn || "home";	
	
	if (req.user) {
		userId = req.user.userId;
	}
	//else {
	//	userId = req.user;
	//}
	
	if (req.params.currentClientId) {
		clientId = req.params.currentClientId;
	}
	//else {
	//	clientId = 0;
	//}
	
	
	
	lotl_api.getClientInfo(clientId, function (err, clientInfo) {
		lotl_api.getUserInfo(userId, function (err, userInfo) {
			lotl_api.addNewRecentClientView(userId, clientId, function () {
				lotl_api.getRecentClientViewsAPI(userId, function (err, userRecentClients) {
					lotl_api.getLastTenMessagesForClient(clientId, function (err, clientRecentMessages) {
					
						res.statusCode = 200;
						res.render('pages/' + pageToReturn, {
							userId: userId,
							userRecentClients: userRecentClients,
							userInfo: userInfo,
							clientInfo: clientInfo,
							clientRecentMessages: clientRecentMessages,
                            authToken: authToken
						});
					});
				});
			});
		});
	});
};


exports.home2 = function (req, res) {
	
	var userId = 0;
	var clientId = null;
	
	if (req.params.currentUserId) {
		userId = req.params.currentUserId;
	}
	else {
		userId = req.user;
	}
	
	if (req.params.currentClientId) {
		clientId = req.params.currentClientId;
	}
	else {
		clientId = 0;
	}
	
	
	
	lotl_api.getClientInfo(clientId, function (err, clientInfo) {
		lotl_api.getUserInfo(userId, function (err, userInfo) {
						
						res.statusCode = 200;
						res.render('pages/home2', {
							userId: userId,
							userInfo: userInfo,
							clientInfo: clientInfo,
						});
		});
	});
};


exports.get_chronos = function (req, res) {
	
	var clientId = req.params.clientId || 0;
	var firstChrono = req.params.firstChrono || 0;
	var chronoCount = req.params.chronoCount || 10;
	
	lotl_api.getRangeOfMessagesForClient(clientId, firstChrono, chronoCount, function (err, clientRecentMessages) {
						
		res.statusCode = 200;
		res.render('partials/chronos', {
			clientId: clientId,
			clientRecentMessages: clientRecentMessages
		});
	});


};

exports.notesHarness = function (req, res) {
	
	res.statusCode = 200;
	res.render('pages/notesHarness');
	
};


exports.clientSearch = function (req, res) {	lotl_api.clientSearch(req, res); };

exports.index2 = lotl_api.getAllMessages;


//==========================================================================================================================
// DATABASE API Calls (uses lotl_api.js)
//==========================================================================================================================

// Create a new Client Message List
exports.new_client_message_list = function (req, res) { lotl_api.newClientMessageList; };

// Create a new User Message List
exports.new_user_message_list = function (req, res) { lotl_api.newUserMessageList; };

// Process saving HTML from CKEditor
exports.save_message = function (req, res) { lotl_api.saveMessage(req, res); };

// Process saving HTML from CKEditor
exports.save_field = function (req, res) { lotl_api.saveField(req, res); };

// Retrieve message item with given ID
exports.get_message_by_id = function (req, res) { lotl_api.getMessageById; };

// Check if particular client ID exists
exports.does_client_exist = function (req, res) { lotl_api.checkClientId(req, res); };

// Get list of recent clients viewed by a user
exports.get_recents_list = function (req, res) { lotl_api.getRecentClientViews(req, res); };

exports.get_recents_list_html = function (req, res) {
	//var userId = req.params.id;
	var userId = req.user;
	
	lotl_api.getRecentClientViewsAPI(userId, function (err, userRecentClients) {
		
		res.statusCode = 200;
		res.render('pages/recentClientsHarness', {
			userRecentClients: userRecentClients
		});
		res.end();
	});
};

