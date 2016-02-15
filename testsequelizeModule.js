var db = require('./db.js');
var sqlite3 = require('sqlite3').verbose();
var dbConnectionString = 'db/testdb.sqlite';
var moment = require('moment');


db.sequelize.sync().then(function () {
	console.log('Everything is synced');
	
	var newMessageText = 'This is a test mesage, mofo, asshole';
	//saveNewOrChangedNote(newMessageText, 0, 137);	

	testFunction();
});

function testFunction() {
	
	db.listMembership.findAll(
		{
			where: { messageListID: 2 },
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
					where: { noteID: {$in: idsOfInterest} },
					order: [
						['noteID', 'DESC']
					]
				}
			).then(function (noteVersionsRows) {

				for (i = 0 ; i < noteVersionsRows.length; i++) {
					console.log('---------------------------------------------------------');
					console.log(noteVersionsRows[i].noteID);
					console.log('---------------------------------------------------------');
					console.log(noteVersionsRows[i].noteVersionsText);
				}
			});
		}
	});

}



function testOldfunction() {
	
	var dateStr = moment().format();
	
	db.notes.create(
		{
			noteID: 112,
			noteText: 'What???????????',
			noteTypeID: 0,
			creatorID: 0
		}
	).then(
		function () {
			console.log('That shit worked');
		},
		function () {
			console.log('That shit DID NOT work');
		}
	);
	
	
};

		
function saveNewOrChangedNote(theMessage,
								userID,
								noteID) {

	desiredMessage = theMessage;
	desiredCreatorID = userID;
	desiredNoteID = noteID;
	
	db.notes.create(
			{
				noteTypeID: 0,
				creatorID: userID,
				noteID: noteID
			}
	).then(
		function (newNote) {
			createNewVersion(newNote.noteID, theMessage)
		},
		function (errorObject) {
			console.log('You cant insert that shit.');

			createNewVersion(desiredNoteID, desiredMessage); 
		}
	);
};

function createNewVersion(newNoteID, theMessage) {

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

	});
};



//var theMessage = req.body.message;
//var dateStr = moment().format();
//var newNoteID = 0;
//var db = new sqlite3.Database(dbConnectionString);

//db.serialize(function () {
//	var theSQL = "INSERT INTO notes (noteText, itemUpdateTimeStamp, creatorID) VALUES (?, ?, ?)";
//	//var stmt = db.prepare(theSQL);
//	db.run(theSQL, theMessage, dateStr, 0, function (err) {
//		console.log(this.lastID);
		
//		newNoteID = this.lastID;
//		console.log(newNoteID);
//		var retJson = { message: newNoteID };
//		res.statusCode = 200;
//		res.json(retJson);
//		res.end();
//		db.close();
//	});
//});
