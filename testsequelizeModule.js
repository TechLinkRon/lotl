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
			where: { messageListId: 2 },
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
					where: { noteId: {$in: idsOfInterest} },
					order: [
						['noteId', 'DESC']
					]
				}
			).then(function (noteVersionsRows) {

				for (i = 0 ; i < noteVersionsRows.length; i++) {
					console.log('---------------------------------------------------------');
					console.log(noteVersionsRows[i].noteId);
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
			noteId: 112,
			noteText: 'What???????????',
			noteTypeId: 0,
			creatorId: 0
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
								userId,
								noteId) {

	desiredMessage = theMessage;
	desiredCreatorId = userId;
	desiredNoteId = noteId;
	
	db.notes.create(
			{
				noteTypeId: 0,
				creatorId: userId,
				noteId: noteId
			}
	).then(
		function (newNote) {
			createNewVersion(newNote.noteId, theMessage)
		},
		function (errorObject) {
			console.log('You cant insert that shit.');

			createNewVersion(desiredNoteId, desiredMessage); 
		}
	);
};

function createNewVersion(newNoteId, theMessage) {

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

	});
};



//var theMessage = req.body.message;
//var dateStr = moment().format();
//var newNoteId = 0;
//var db = new sqlite3.Database(dbConnectionString);

//db.serialize(function () {
//	var theSQL = "INSERT INTO notes (noteText, itemUpdateTimeStamp, creatorId) VALUES (?, ?, ?)";
//	//var stmt = db.prepare(theSQL);
//	db.run(theSQL, theMessage, dateStr, 0, function (err) {
//		console.log(this.lastId);
		
//		newNoteId = this.lastId;
//		console.log(newNoteId);
//		var retJson = { message: newNoteId };
//		res.statusCode = 200;
//		res.json(retJson);
//		res.end();
//		db.close();
//	});
//});
