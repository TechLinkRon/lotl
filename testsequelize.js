var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect': 'sqlite',
	'storage': 'db/testdb.sqlite'
});


var client = sequelize.define('client', {
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
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

var userTable = sequelize.define('userTable', {
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

var clientMessageLists = sequelize.define('clientMessageLists', {
	cliectMessageListId: {
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

var listMembership = sequelize.define('listMembership', {
	listMembershipId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	messageListId: {
		type: Sequelize.INTEGER
	},
	noteId: {
		type: Sequelize.INTEGER
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

var notes = sequelize.define('notes', {
	noteId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	creatorId: {
		type: Sequelize.INTEGER
	},
	noteText: {
		type: Sequelize.TEXT
	},
	itemUpdateTimeStamp: {
		type: Sequelize.DATE
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

/*
var recentClientViews = sequelize.define('recentClientViews', {
	recentClientViewsId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	recentViewer: {
		type: Sequelize.INTEGER
	},
	recentViewee: {
		type: Sequelize.INTEGER
	}
},
{
	freezeTableName: true,
	timestamps: false
	
});

 */

var taskList = sequelize.define('taskList', {
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

var userMessageLists = sequelize.define('userMessageLists', {
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


sequelize.sync().then(function () {
	console.log('Everything is synced');
	
	recentClientViews.findAll().then(function (theViews) {
		if (theViews) {
			for (i = 0; i < theViews.length; i++) {
				console.log(theViews[i].toJSON());
			}
		}
	});



});
