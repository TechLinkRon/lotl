var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var moment = require('moment');
var dbConnectionString = 'db/testdb.sqlite';
var db = require('./db.js');


exports.newClientMessageList = function (req, res) {

	var newListClientId = req.body.listClientId;
  var newListCreatorId = req.body.listCreatorId;
  var newListName = req.body.listName;
  var newListId = 0;
	var db = new sqlite3.Database(dbConnectionString);
  
  db.serialize(function() {
    var theSQL = "INSERT INTO clientMessageLists (clientId, creatorUserId, listName) VALUES ($cId, $cUID, $lN)";

    db.run(theSQL,
      {
          $cId: newListClientId,
          $cUID: newListCreatorId,
          $lN: newListName
      },
      function (err) {
        console.log(this.lastId);
  
        newListId = this.lastId;
        console.log(newListId);
        var retJson = { newListId: newListId };
        res.statusCode = 200;
        res.json(retJson);
        res.end();
        db.close();
      }
     );
  });
}

exports.newUserMessageList = function (req, res) {

	var newListOwnerId = req.body.listOwnerId;
  var newListCreatorId = req.body.listCreatorId;
  var newListName = req.body.listName;
  var newListId = 0;
  var db = new sqlite3.Database(dbConnectionString);
  
  db.serialize(function() {
    var theSQL = "INSERT INTO userMessageLists (ownerUserId, creatorUserId, listName) VALUES ($oUID, $cUID, $lN)";

    db.run(theSQL,
      {
          $oUID: newListOwnerId,
          $cUID: newListCreatorId,
          $lN: newListName
      },
      function (err) {
        console.log(this.lastId);
  
        newListId = this.lastId;
        console.log(newListId);
        var retJson = { newListId: newListId };
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

	db.client.update(
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
	
	var desiredCreatorId = req.user.userId;
	var desiredMessage = req.body.message;
	var desiredNoteId = req.body.messageId;
	var desiredClientId = req.body.clientId;
	
	if (desiredNoteId === 0) { desiredNoteId = null; }
	desiredClientId = desiredClientId || 0;
	
	db.notes.create(
		{
			noteTypeId: 0,
			creatorId: desiredCreatorId,
			noteId: desiredNoteId
		}
	).then(
		function (newNote) {
			// now that we've created a new note, create the first version of that note
			// and associate it with this client
			assignNoteToClient(newNote.noteId, desiredClientId, createNewVersion(newNote.noteId, desiredMessage, res));
		},
		function (errorObject) {
			// the noteId already exists, so just create new version
			
			createNewVersion(desiredNoteId, desiredMessage, res);
		}
	);
};

function assignNoteToClient(noteId, clientId, callMeBack) {

	db.clientToNote.create(
		{
			clientId: clientId,
			noteId: noteId
		}
	).then(callMeBack);
	
	
}

function createNewVersion(newNoteId, theMessage, res) {
	
	var dateStr = moment().format();
	
	db.noteVersions.create(
		{
			noteId: newNoteId,
			noteVersionsText: theMessage,
			noteVersionsUpdateTimeStamp: dateStr
		}
	).then(function (newNoteVersion) {
		console.log('Version ID: ' + newNoteVersion.noteVersionsId);
		console.log('Message ID: ' + newNoteId);
		
		// put current version id and text into notes table as well
		db.notes.update(
			{
				currentVersionId: newNoteVersion.noteVersionsId,
				currentVersionText: theMessage
					},
							{
				where: {
					noteId : newNoteId
				}
			}
			).then(function () {
				
				var retJson = { message: newNoteId };
				res.statusCode = 200;
				res.json(retJson);
				res.end();
			});
	});
};

exports.addNewRecentClientView = function (userId, clientId, callMeBack) {
	
	db.recentClientViews.upsert(
		{
			recentViewer: userId,
			recentViewee: clientId
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

exports.getMessageById = function (req, res) {

	var theMessageId = req.body.messageId;
  var db = new sqlite3.Database(dbConnectionString);
  
  db.serialize(function() {

    var theSQL = "SELECT * FROM notes WHERE noteId = $LIID;";

    db.all(theSQL,
      {
          $LIID: theMessageId
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
	
	db.client.findAll(
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
						clientId: clientMatches[i].clientId
					});
			}
		}
		res.statusCode = 200;
		res.json(matchingClientNames);
		res.end();

	});
}


exports.checkClientId = function (req, res) {
	var clientId = req.params.id;
	
	doesClientExist(clientId, 
                    function (err, clientExists) {
		
		console.log("Answer is: ", clientExists);
		
		//                      var retJSON = { existance : clientExists.doesHeExist,
		//                                      clientName: clientExists.clientName};
		res.statusCode = 200;
		res.json(clientExists);
		res.end();
                      
	});
};


exports.getRecentClientViewsAPI = function (userId, callMeBack2) {
	
	var theClientViews = [];
    
    userId = userId || 0;
	console.log('Calling findAll()...');
	

        db.recentClientViews.findAll(
            {
                attributes: ['recentViewer' , 'recentViewee'],
                include: [
                    {
                        model: db.client,
                        attributes: ['clientName'],
                        as: 'client'
                    }
                ],
                where: { recentViewer: userId },
                order: [
                    ['updatedAt', 'DESC']
                ]

            }
        ).then(function (recentClientViews) {

            if (recentClientViews) {
                for (i = 0; i < recentClientViews.length; i++) {

                    var answerObject = {
                        clientName: recentClientViews[i].client.clientName,
                        clientId: recentClientViews[i].recentViewee
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
	
	db.user.findById(targetUserId).then(function (userTableEntry) {
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
			where: { clientId: targetClientId }
		}
	).then(function (clientMessageListRow) {
		
		if (clientMessageListRow) {
			console.log('>>>>>>>>>>>>>>>> need messsageListId to be ' + clientMessageListRow);
			
			db.listMembership.findAll(
				{
					where: { messageListId: clientMessageListRow.clientMessageListId },
					order: [
						['noteId', 'DESC']
					],
					limit: 10
				}
			).then(function (listMembershipRows) {
				
				if (listMembershipRows) {
					
					idsOfInterest = [];
					for (i = 0; i < listMembershipRows.length; i++) {
						idsOfInterest.push(listMembershipRows[i].noteId);
					}
					
					db.noteVersions.findAll(
						{
							where: { noteId: { $in: idsOfInterest } },
							order: [
								['noteId', 'DESC']
							]
						}
					).then(function (noteVersionsRows) {
						
						if (noteVersionsRows) {
							callMeBack(null, noteVersionsRows);
						}
						else { callMeBack(null, []); };


					//for (i = 0 ; i < noteVersionsRows.length; i++) {
					//	console.log('---------------------------------------------------------');
					//	console.log(noteVersionsRows[i].noteId);
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
					where: { clientId: targetClientId },
					order: [
						['noteId', 'DESC']
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
						idsOfInterest.push(notes[i].noteId);
					}
					db.notes.findAll(
						{
							where: { noteId: { $in: idsOfInterest } },
							order: [
								['noteId', 'DESC']
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
			where: { clientId: targetClientId }
		}
	).then(function (clientMessageListRow) {
		
		if (clientMessageListRow) {
			
			db.listMembership.findAll(
				{
					where: { messageListId: clientMessageListRow.clientMessageListId },
					order: [
						['noteId', 'DESC']
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
						idsOfInterest.push(listMembershipRows[i].noteId);
					}
					db.noteVersions.findAll(
						{
							where: { noteId: { $in: idsOfInterest } },
							order: [
								['noteId', 'DESC']
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
	
	db.client.findById(targetClientId).then(function (clientEntry) {
		if (clientEntry) {
			clientInfo = clientEntry;
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









function doesClientExist(testClientId, callMeBack) {

  async.waterfall([
    function(callback) {
      callback(null, testClientId);
    },
    function (clientId, callback){
      var db = new sqlite3.Database(dbConnectionString);
      var theSQL = "SELECT * FROM client WHERE clientId = $cId;";
    
      db.all(theSQL,
          {
              $cId: clientId
          },
          function (err, rows) {
            
            var theAnswer = {
                clientIdQuery: testClientId,
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
//	var newNoteId = 0;
//	var db = new sqlite3.Database(dbConnectionString);
	
//	db.serialize(function () {
//		var theSQL = "INSERT INTO notes (noteText, itemUpdateTimeStamp, creatorId) VALUES (?, ?, ?)";
//		//var stmt = db.prepare(theSQL);
//		db.run(theSQL, theMessage, dateStr, 0, function (err) {
//			console.log(this.lastId);
			
//			newNoteId = this.lastId;
//			console.log(newNoteId);
//			var retJson = { message: newNoteId };
//			res.statusCode = 200;
//			res.json(retJson);
//			res.end();
//			db.close();
//		});
//	});
  

//}

//function getClientViewsAPI(testClientId) {
	
//	var recentClientViews = [];
	
//	async.waterfall(
//		[
//			function (callback) {
//				var db = new sqlite3.Database(dbConnectionString);
//				var theSQL = "SELECT recentClientViews.recentViewee, clientTable.clientName FROM recentClientViews, clientTable WHERE recentClientViews.recentViewer = $cId AND recentClientViews.recentViewee = client.clientId;";
				
//				db.all(theSQL, { $cId: testClientId	},
//					function (err, rows) {
					
//						if (rows.length == 0) {
//							theAnswer.doesHeExist = false;
//							theAnswer.clientName = null;
//						}
//						else {
//							for (counter = 0; counter < rows.length; counter++) {
							
//								var answerObject = {
//									clientName: rows[counter].clientName,
//									recentVieweeId: rows[counter].recentViewee
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
//	var clientId = req.params.id;
	
//	getClientViews(clientId, function (err, clientViews) {
		
//		console.log("Answer is: ", clientViews);
		
//		res.statusCode = 200;
//		res.json(clientViews);
//		res.end();
                      
//	});
//};