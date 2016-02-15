var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var moment = require('moment');
var dbConnectionString = 'db/testdb.sqlite';


exports.newClientMessageList = function (req, res) {

	var newListClientID = req.body.listClientID;
  var newListCreatorID = req.body.listCreatorID;
  var newListName = req.body.listName;
  var newListID = 0;
	var db = new sqlite3.Database(dbConnectionString);
  
  db.serialize(function() {
    var theSQL = "INSERT INTO clientMessageLists (clientID, creatorUserID, listName) VALUES ($cID, $cUID, $lN)";

    db.run(theSQL,
      {
          $cID: newListClientID,
          $cUID: newListCreatorID,
          $lN: newListName
      },
      function (err) {
        console.log(this.lastID);
  
        newListID = this.lastID;
        console.log(newListID);
        var retJson = { newListID: newListID };
        res.statusCode = 200;
        res.json(retJson);
        res.end();
        db.close();
      }
     );
  });
}

exports.newUserMessageList = function (req, res) {

	var newListOwnerID = req.body.listOwnerID;
  var newListCreatorID = req.body.listCreatorID;
  var newListName = req.body.listName;
  var newListID = 0;
  var db = new sqlite3.Database(dbConnectionString);
  
  db.serialize(function() {
    var theSQL = "INSERT INTO userMessageLists (ownerUserID, creatorUserID, listName) VALUES ($oUID, $cUID, $lN)";

    db.run(theSQL,
      {
          $oUID: newListOwnerID,
          $cUID: newListCreatorID,
          $lN: newListName
      },
      function (err) {
        console.log(this.lastID);
  
        newListID = this.lastID;
        console.log(newListID);
        var retJson = { newListID: newListID };
        res.statusCode = 200;
        res.json(retJson);
        res.end();
        db.close();
      }
     );
  });
}

//Post.update({
//	updatedAt: null,
//}, {
//	where: {
//		deletedAt: {
//			$ne: null
//		}
//	}
//});

exports.saveField = function (req, res) {
	
	var desiredClientId = req.body.clientId;
	var desiredMessage = req.body.message;
	var desiredMessageField = req.body.messageField;
	//desiredMessage = desiredMessage.replace(/&nbsp;/g, ' ');
	
	var updateObject = {};
	updateObject[desiredMessageField] = desiredMessage;

	db.clientTable.update(
		updateObject,
		{
			where: {
				clientId : desiredClientId
			}
		}
	).then(
		function (returnedValues) {
			var affectedRowCount = returnedValues[0];
			var responseToBrowser = "";
			if (affectedRowCount === 1) {
				responseToBrowser = "OK";
			}
			else {
				responseToBrowser = "FAIL";
			}

			var retJson = { message: responseToBrowser };
			res.statusCode = 200;
			res.json(retJson);
			res.end();
		}
	);
		
};

exports.saveMessage = function (req, res) {
	
	var desiredCreatorID = req.user;
	var desiredMessage = req.body.message;
	var desiredNoteID = req.body.messageID;
	var desiredClientID = req.body.clientID;
	
	if (desiredNoteID === 0) { desiredNoteID = null; }
	desiredClientID = desiredClientID || 0;
	
	db.notes.create(
		{
			noteTypeID: 0,
			creatorID: desiredCreatorID,
			noteID: desiredNoteID
		}
	).then(
		function (newNote) {
			// now that we've created a new note, create the first version of that note
			// and associate it with this client
			assignNoteToClient(newNote.noteID, desiredClientID, createNewVersion(newNote.noteID, desiredMessage, res));
		},
		function (errorObject) {
			// the noteID already exists, so just create new version
			
			createNewVersion(desiredNoteID, desiredMessage, res);
		}
	);
};

function assignNoteToClient(noteID, clientID, callMeBack) {

	db.clientToNote.create(
		{
			clientID: clientID,
			noteID: noteID
		}
	).then(callMeBack);
	
	
}

function createNewVersion(newNoteID, theMessage, res) {
	
	var dateStr = moment().format();
	
	db.noteVersions.create(
		{
			noteID: newNoteID,
			noteVersionsText: theMessage,
			noteVersionsUpdateTimeStamp: dateStr
		}
	).then(function (newNoteVersion) {
		console.log('Version ID: ' + newNoteVersion.noteVersionsID);
		console.log('Message ID: ' + newNoteID);
		
		// put current version id and text into notes table as well
		db.notes.update(
			{
				currentVersionID: newNoteVersion.noteVersionsID,
				currentVersionText: theMessage
					},
							{
				where: {
					noteID : newNoteID
				}
			}
			).then(function () {
				
				var retJson = { message: newNoteID };
				res.statusCode = 200;
				res.json(retJson);
				res.end();
			});
	});
};

exports.addNewRecentClientView = function (userID, clientID, callMeBack) {
	
	db.recentClientViews.upsert(
		{
			recentViewer: userID,
			recentViewee: clientID
		}
	).then(function () {
		callMeBack();
	});
	
};

exports.getAllMessages = function (req, res) {
  
	var db = new sqlite3.Database(dbConnectionString);
  
	db.serialize(function() {

		var theSQL = "SELECT * FROM notes;";

		db.all(theSQL,
			{},
			function (err, rows) {
  
				res.render('pages/index2', {
				rows : rows
			});
			db.close();
		});
	});
}

exports.getMessageByID = function (req, res) {

	var theMessageID = req.body.messageID;
  var db = new sqlite3.Database(dbConnectionString);
  
  db.serialize(function() {

    var theSQL = "SELECT * FROM notes WHERE noteID = $LIID;";

    db.all(theSQL,
      {
          $LIID: theMessageID
      },
      function (err, rows) {
  
        var theMessageText = rows[0].noteText;
        console.log(theMessageText);
        var retJson = { message: theMessageText };
        res.statusCode = 200;
        res.json(retJson);
        res.end();
        db.close();
    });
  });
}

exports.clientSearch = function (req, res) {
	
	var clientSearchString = req.params.searchTerm;
	var matchingClientNames = [];
	
	db.clientTable.findAll(
		{
			attributes: ['clientId' , 'clientName'],
			where: {
				clientName: {
					$like: '%' + clientSearchString + '%'
				}
			}
		}
	).then(function (clientMatches) {
		
		if (clientMatches) {
			for (i = 0; i < clientMatches.length; i++) {
				matchingClientNames.push(
					{
						clientName: clientMatches[i].clientName,
						clientID: clientMatches[i].clientId
					});
			}
		}
		res.statusCode = 200;
		res.json(matchingClientNames);
		res.end();

	});
}


exports.checkClientID = function (req, res) {
	var clientID = req.params.id;
	
	doesClientExist(clientID, 
                    function (err, clientExists) {
		
		console.log("Answer is: ", clientExists);
		
		//                      var retJSON = { existance : clientExists.doesHeExist,
		//                                      clientName: clientExists.clientName};
		res.statusCode = 200;
		res.json(clientExists);
		res.end();
                      
	});
};


exports.getRecentClientViewsAPI = function (userID, callMeBack2) {
	
	var theClientViews = [];
	console.log('Calling findAll()...');
	
	db.recentClientViews.findAll(
		{
			attributes: ['recentViewer' , 'recentViewee'],
			include: [
				{
					model: db.clientTable,
					attributes: ['clientName'],
					as: 'clientTable'
				}
			],
			where: { recentViewer: userID },
			order: [
				['updatedAt', 'DESC']
			]

		}
	).then(function (recentClientViews) {
		
		if (recentClientViews) {
			for (i = 0; i < recentClientViews.length; i++) {
				
				var answerObject = {
					clientName: recentClientViews[i].clientTable.clientName,
					clientID: recentClientViews[i].recentViewee
				};
				
				console.log(answerObject);
				theClientViews.push(answerObject);
			}
		}
		callMeBack2(null, theClientViews);

	});
				

};



exports.getUserInfo = function (targetUserId, callMeBack) {
	
	var userInfo = {};
	
	db.userTable.findById(targetUserId).then(function (userTableEntry) {
		if (userTableEntry) {
			userInfo.firstName = userTableEntry.firstName;
			userInfo.lastName = userTableEntry.lastName;
		}
		callMeBack(null, userInfo);
	});


};

exports.getLastTenMessagesForClient = function (targetClientId, callMeBack) {
	
	
	db.clientMessageLists.findOne(
		{
			where: { clientID: targetClientId }
		}
	).then(function (clientMessageListRow) {
		
		if (clientMessageListRow) {
			console.log('>>>>>>>>>>>>>>>> need messsageListID to be ' + clientMessageListRow);
			
			db.listMembership.findAll(
				{
					where: { messageListID: clientMessageListRow.clientMessageListID },
					order: [
						['noteID', 'DESC']
					],
					limit: 10
				}
			).then(function (listMembershipRows) {
				
				if (listMembershipRows) {
					
					idsOfInterest = [];
					for (i = 0; i < listMembershipRows.length; i++) {
						idsOfInterest.push(listMembershipRows[i].noteID);
					}
					
					db.noteVersions.findAll(
						{
							where: { noteID: { $in: idsOfInterest } },
							order: [
								['noteID', 'DESC']
							]
						}
					).then(function (noteVersionsRows) {
						
						if (noteVersionsRows) {
							callMeBack(null, noteVersionsRows);
						}
						else { callMeBack(null, []); };


					//for (i = 0 ; i < noteVersionsRows.length; i++) {
					//	console.log('---------------------------------------------------------');
					//	console.log(noteVersionsRows[i].noteID);
					//	console.log('---------------------------------------------------------');
					//	console.log(noteVersionsRows[i].noteVersionsText);
					//}
					});
				}
				else { callMeBack(null, []); };
			});
		}
		else { callMeBack(null, []); };
	});
};


exports.getRangeOfMessagesForClient = function (targetClientId, firstMessage, messageCount, callMeBack) {
	
		
			db.clientToNote.findAll(
				{
					where: { clientID: targetClientId },
					order: [
						['noteID', 'DESC']
					]
				}
			).then(function (notes) {
				
				if (notes) {
					
					var start = 0;
					var finish = 0;
					start = Number(firstMessage);
					finish = start + Number(messageCount);
					
					if (finish > notes.length) {
						finish = notes.length;
					}
					
					idsOfInterest = [];
					for (i = start; i < finish; i++) {
						idsOfInterest.push(notes[i].noteID);
					}
					db.notes.findAll(
						{
							where: { noteID: { $in: idsOfInterest } },
							order: [
								['noteID', 'DESC']
							]
						}
			).then(function (notesWeWant) {
						
				if (notesWeWant) {
					
					var convertedDateString = '';
					for (i = 0; i < notesWeWant.length; i++) {
						if (notesWeWant[i].updatedAt) {
							convertedDateString = my_date_format(notesWeWant[i].updatedAt);
							notesWeWant[i].updatedAtFriendly = convertedDateString;
						}
						else {
							notesWeWant[i].updatedAtFriendly = "no date";
						}
					}

					callMeBack(null, notesWeWant);
				}
				else { callMeBack(null, []); };
			});
		}
		else { callMeBack(null, []); };
	});

};

var my_date_format = function (input) {
	var d = new Date(Date.parse(input.replace(/-/g, "/")));
	var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var date = month[d.getMonth()] + " " + d.getDay() + ", " + d.getFullYear();
	var time = d.toLocaleTimeString().toLowerCase().replace(/([\d]+:[\d]+):[\d]+(\s\w+)/g, "$1$2");
	return (date + " at " + time);
};


exports.HoldgetRangeOfMessagesForClient = function (targetClientId, firstMessage, messageCount, callMeBack) {
	
	
	db.clientMessageLists.findOne(
		{
			where: { clientID: targetClientId }
		}
	).then(function (clientMessageListRow) {
		
		if (clientMessageListRow) {
			
			db.listMembership.findAll(
				{
					where: { messageListID: clientMessageListRow.clientMessageListID },
					order: [
						['noteID', 'DESC']
					]
				}
			).then(function (listMembershipRows) {
				
				if (listMembershipRows) {
					
					var start = 0;
					var finish = 0;
					start = Number(firstMessage);
					finish = start + Number(messageCount);

					if (finish > listMembershipRows.length) {
						finish = listMembershipRows.length;
					}
					
					idsOfInterest = [];
					for (i = start; i < finish; i++) {
						idsOfInterest.push(listMembershipRows[i].noteID);
					}
					db.noteVersions.findAll(
						{
							where: { noteID: { $in: idsOfInterest } },
							order: [
								['noteID', 'DESC']
							]
						}
					).then(function (noteVersionsRows) {
						
						if (noteVersionsRows) {
							
							callMeBack(null, noteVersionsRows);
						}
						else { callMeBack(null, []); };
					});
				}
				else { callMeBack(null, []); };
			});
		}
		else { callMeBack(null, []); };
	});
};


exports.getClientInfo = function (targetClientId, callMeBack) {
	
	var clientInfo = {};
	
	db.clientTable.findById(targetClientId).then(function (clientTableEntry) {
		if (clientTableEntry) {
			clientInfo = clientTableEntry;
		}
		
		clientInfo.clientPhoneNotes = clientInfo.clientPhoneNotes || "";
		clientInfo.clientHealthInsuranceNotes = clientInfo.clientHealthInsuranceNotes || "";
		clientInfo.clientWorkersCompCarrierNotes = clientInfo.clientWorkersCompCarrierNotes || "";
		clientInfo.clientDOANotes = clientInfo.clientDOANotes || "";
		clientInfo.clientLiensNotes = clientInfo.clientLiensNotes || "";
		clientInfo.clientLastPaymentDateNotes = clientInfo.clientLastPaymentDateNotes || "";
		clientInfo.clientTypeOfCaseNotes = clientInfo.clientTypeOfCaseNotes || "";
		clientInfo.clientLastPaymentDateNotes = clientInfo.clientLastPaymentDateNotes || "";
		clientInfo.client60LCodeNotes = clientInfo.client60LCodeNotes || "";
		clientInfo.clientCaseStyleAndAttorneysNotes = clientInfo.clientCaseStyleAndAttorneysNotes || "";
		clientInfo.clientDisabilityInsuranceNotes = clientInfo.clientDisabilityInsuranceNotes || "";
		clientInfo.clientNoFaultCarrierNotes = clientInfo.clientNoFaultCarrierNotes || "";
		clientInfo.clientFaultCarrierNotes = clientInfo.clientFaultCarrierNotes || "";
		
				
		clientInfo.clientPhoneNotes = clientInfo.clientPhoneNotes.replace(/[\r\n]/g, '');
		clientInfo.clientHealthInsuranceNotes = clientInfo.clientHealthInsuranceNotes.replace(/[\r\n]/g, '');
		clientInfo.clientWorkersCompCarrierNotes = clientInfo.clientWorkersCompCarrierNotes.replace(/[\r\n]/g, '');
		clientInfo.clientDOANotes = clientInfo.clientDOANotes.replace(/[\r\n]/g, '');
		clientInfo.clientLiensNotes = clientInfo.clientLiensNotes.replace(/[\r\n]/g, '');
		clientInfo.clientLastPaymentDateNotes = clientInfo.clientLastPaymentDateNotes.replace(/[\r\n]/g, '');
		clientInfo.clientTypeOfCaseNotes = clientInfo.clientTypeOfCaseNotes.replace(/[\r\n]/g, '');
		clientInfo.clientLastPaymentDateNotes = clientInfo.clientLastPaymentDateNotes.replace(/[\r\n]/g, '');
		clientInfo.client60LCodeNotes = clientInfo.client60LCodeNotes.replace(/[\r\n]/g, '');
		clientInfo.clientCaseStyleAndAttorneysNotes = clientInfo.clientCaseStyleAndAttorneysNotes.replace(/[\r\n]/g, '');
		clientInfo.clientDisabilityInsuranceNotes = clientInfo.clientDisabilityInsuranceNotes.replace(/[\r\n]/g, '');
		clientInfo.clientNoFaultCarrierNotes = clientInfo.clientNoFaultCarrierNotes.replace(/[\r\n]/g, '');
		clientInfo.clientFaultCarrierNotes = clientInfo.clientFaultCarrierNotes.replace(/[\r\n]/g, '');
		
		callMeBack(null, clientInfo);
	});


};









function doesClientExist(testClientID, callMeBack) {

  async.waterfall([
    function(callback) {
      callback(null, testClientID);
    },
    function (clientID, callback){
      var db = new sqlite3.Database(dbConnectionString);
      var theSQL = "SELECT * FROM clientTable WHERE clientID = $cID;";
    
      db.all(theSQL,
          {
              $cID: clientID
          },
          function (err, rows) {
            
            var theAnswer = {
                clientIDQuery: testClientID,
                doesHeExist: false,
                clientName: null
            };
            
            if (rows.length == 0) {
              theAnswer.doesHeExist = false;
              theAnswer.clientName = null;
            }
            else
            {
              theAnswer.doesHeExist = true;
              theAnswer.clientName = rows[0].clientName;
            }
      
            db.close();
            
            callback(null, theAnswer);
        });  
    }],
    function (err, result) {
      callMeBack(err, result);
    });

}

//exports.saveMessageOrig = function (req, res) {
	
//	var theMessage = req.body.message;
//	var dateStr = moment().format();
//	var newNoteID = 0;
//	var db = new sqlite3.Database(dbConnectionString);
	
//	db.serialize(function () {
//		var theSQL = "INSERT INTO notes (noteText, itemUpdateTimeStamp, creatorID) VALUES (?, ?, ?)";
//		//var stmt = db.prepare(theSQL);
//		db.run(theSQL, theMessage, dateStr, 0, function (err) {
//			console.log(this.lastID);
			
//			newNoteID = this.lastID;
//			console.log(newNoteID);
//			var retJson = { message: newNoteID };
//			res.statusCode = 200;
//			res.json(retJson);
//			res.end();
//			db.close();
//		});
//	});
  

//}

//function getClientViewsAPI(testClientID) {
	
//	var recentClientViews = [];
	
//	async.waterfall(
//		[
//			function (callback) {
//				var db = new sqlite3.Database(dbConnectionString);
//				var theSQL = "SELECT recentClientViews.recentViewee, clientTable.clientName FROM recentClientViews, clientTable WHERE recentClientViews.recentViewer = $cID AND recentClientViews.recentViewee = clientTable.clientID;";
				
//				db.all(theSQL, { $cID: testClientID	},
//					function (err, rows) {
					
//						if (rows.length == 0) {
//							theAnswer.doesHeExist = false;
//							theAnswer.clientName = null;
//						}
//						else {
//							for (counter = 0; counter < rows.length; counter++) {
							
//								var answerObject = {
//									clientName: rows[counter].clientName,
//									recentVieweeID: rows[counter].recentViewee
//								};
							
//								recentClientViews.push(answerObject);
							
//							}
//						}
					
//						db.close();
					
//					console.log('At end of db.all callback');
//						callback(null, recentClientViews);
//					}
//				); // db.all
//				console.log('After the db.all call');
//			}
//		],
//    function (err, result) {
//			console.log('Getting ready to return');
//			return recentClientViews;
//		});
//	console.log('After async.waterfall call');

//}

//exports.getRecentClientViews = function (req, res) {
//	var clientID = req.params.id;
	
//	getClientViews(clientID, function (err, clientViews) {
		
//		console.log("Answer is: ", clientViews);
		
//		res.statusCode = 200;
//		res.json(clientViews);
//		res.end();
                      
//	});
//};