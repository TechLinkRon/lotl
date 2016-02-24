var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect': 'sqlite',
	'storage': __dirname + '/db/lotl.sqlite'
});

var db = {};



db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.user = sequelize.import(__dirname + '/models/user.js');
db.client = sequelize.import(__dirname + '/models/client.js');
db.token = sequelize.import(__dirname + '/models/token.js');


// ***************************************************************
// ****************  clientTable  ********************************
// ************************************************************
/*
db.clientTable = sequelize.define('clientTable', {
    clientId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    clientName: {
        type: Sequelize.STRING(255)
    },
    clientAddress: {
        type: Sequelize.STRING(255)
    },
    clientCity: {
        type: Sequelize.STRING(255)
    },
    clientState: {
        type: Sequelize.STRING(50)
    },
    clientZip: {
        type: Sequelize.STRING(10)
    },
    clientEmailAddress: {
        type: Sequelize.STRING(80)
    },
    clientLiensNotes: {
        type: Sequelize.TEXT
    },
    clientPhoneNotes: {
        type: Sequelize.TEXT
    },
    clientHealthInsuranceNotes: {
        type: Sequelize.TEXT
    },      
    clientWorkersCompCarrierNotes: {
        type: Sequelize.TEXT
    },   
    clientTypeOfCaseNotes: {
        type: Sequelize.TEXT
    },           
    clientDOANotes: {
        type: Sequelize.TEXT
    },                  
    clientLastPaymentDateNotes: {
        type: Sequelize.TEXT
    },      
    client60LCodeNotes: {
        type: Sequelize.TEXT
    },              
    clientCaseStyleAndAttorneysNotes: {
        type: Sequelize.TEXT
    },
    clientDisabilityInsuranceNotes: {
        type: Sequelize.TEXT
    },  
    clientNoFaultCarrierNotes: {
        type: Sequelize.TEXT
    },       
    clientFaultCarrierNotes: {
        type: Sequelize.TEXT
    },
    clientDocumentationRoot: {
        type: Sequelize.TEXT
    }
},
{
    freezeTableName: true
    
})
*/



// ***************************************************************
// ****************  userTable  **********************************
// ***************************************************************
/*
db.userTable = sequelize.define('userTable', {
	userId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	userName: {
		type: Sequelize.STRING(50)
	},
	userPassword: {
		type: Sequelize.STRING(50)
	},
	firstName: {
		type: Sequelize.STRING(50)
	},
	lastName: {
		type: Sequelize.STRING(50)
	},
	lastLogin: {
		type: Sequelize.DATE
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});
*/

// ***************************************************************
// ****************  clientMessageLists  *************************
// ***************************************************************

db.clientMessageLists = sequelize.define('clientMessageLists', {
	clientMessageListId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	clientId: {
		type: Sequelize.INTEGER
	},
	creatorUserId: {
		type: Sequelize.INTEGER
	},
	listName: {
		type: Sequelize.STRING(100)
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

// ***************************************************************
// ****************  listMembership  *****************************
// ***************************************************************

db.listMembership = sequelize.define('listMembership', {
	messageListId: {
		type: Sequelize.INTEGER,
		primaryKey: 'compositeKey1'
	},
	noteId: {
		type: Sequelize.INTEGER,
		primaryKey: 'compositeKey1'
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

// ***************************************************************
// ****************  notes  ***************************
// ***************************************************************

db.notes = sequelize.define('notes', {
	noteId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	creatorId: {
		type: Sequelize.INTEGER
	},
	noteTypeId: {
		type: Sequelize.INTEGER
	},
	currentVersionText: {
		type: Sequelize.TEXT
	},
	currentVersionId: {
		type: Sequelize.INTEGER
	}
},
{
	freezeTableName: true
	
});

db.notes.belongsTo(db.user, { foreignKey: 'creatorId' });
//db.user.hasMany(db.notes);


// ***************************************************************
// ****************  noteVersions  *******************
// ***************************************************************

db.noteVersions = sequelize.define('noteVersions', {
	noteVersionsId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	noteId: {
		type: Sequelize.INTEGER
	},
	noteVersionsText: {
		type: Sequelize.TEXT
	}
},
{
	freezeTableName: true
	
});

// ***************************************************************
// ****************  taskList  ***********************************
// ***************************************************************

db.taskList = sequelize.define('taskList', {
	taskListId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	ownerId: {
		type: Sequelize.INTEGER
	},
	taskListText: {
		type: Sequelize.STRING(100)
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

// ***************************************************************
// ****************  userMessageLists  ***************************
// ***************************************************************

db.userMessageLists = sequelize.define('userMessageLists', {
	userMessageListId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	ownerUserId: {
		type: Sequelize.INTEGER
	},
	creatorUserId: {
		type: Sequelize.INTEGER
	},
	listName: {
		type: Sequelize.STRING(100)
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

// ***************************************************************
// ****************  recentClientViews  **************************
// ***************************************************************

db.recentClientViews = sequelize.define('recentClientViews', {
	recentClientViewsId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	recentViewer: {
		type: Sequelize.INTEGER, 
		unique: 'compositeIndex'
	},
	recentViewee: {
		type: Sequelize.INTEGER, 
		unique: 'compositeIndex'
	}
},
{
	freezeTableName: true
});

db.recentClientViews.belongsTo(db.client, { foreignKey: 'recentViewee' });
db.recentClientViews.belongsTo(db.user, { foreignKey: 'recentViewer' });



// ***************************************************************
// *********************  clientToNote  **************************
// ***************************************************************

db.clientToNote = sequelize.define('clientToNote', {
	clientToNoteId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	clientId: {
		type: Sequelize.INTEGER
	},
	noteId: {
		type: Sequelize.INTEGER
	}
},
{
	freezeTableName: true
});

//db.clientToNote.belongsTo()


module.exports = db;
