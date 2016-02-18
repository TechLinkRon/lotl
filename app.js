var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

var fs = require('fs');
var _=require('underscore');
var bcrypt = require('bcrypt');
var db = require('./db.js');
var middleware = require('./middleware.js')(db);


var app = express();
var routes = require('./routes/routes.js');
var fs_apis = require('./lotl_files_api.js');

var moment = require('moment');
var path = require('path');

var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var session = require('client-sessions');


app.set('view engine', 'ejs');

//==========================================================================================================================
// SESSION CODE
//==========================================================================================================================
app.use(session({
	cookieName: 'session',
	secret: 'random_string_goes_here',
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));

app.use(function (req, res, next) {
	if (req.session && req.session.user) {
		//User.findOne({ email: req.session.user.email }, function (err, user) {
		//	if (user) {
		//		req.user = user;
		//		delete req.user.password; // delete the password from the session
		//		req.session.user = user;  //refresh the session value
		//		res.locals.user = user;
		//	}
		//	// finishing processing the middleware and run the route
		
		// automatically use userid 1 for now
		req.session.user = 1;
		req.user = req.session.user;
		
		next();
		//});
	} else {

		// automatically use userid 1 for now
		req.session.user = 1;
		req.user = req.session.user;

		next();
	}
});

//==========================================================================================================================
// END SESSION CODE
//==========================================================================================================================


var jsonParser = bodyParser.json(
                        {
                          limit: '5000kb'
                        }
);

var theFileSystemRoot = "c:\\inetpub\\wwwroot\\gabe-before-express\\";

app.get('/', routes.index);
app.get('/notesHarness', routes.notesHarness);
app.get('/index2', routes.index2);
app.get('/home', routes.home);
app.get('/home/:currentUserID/:currentClientID', routes.home);
app.get('/newhome/:currentUserID/:currentClientID', routes.newhome);
app.get('/home2/:currentUserID/:currentClientID', routes.home2);
app.get('/home/:currentUserID', routes.home);

app.get('/clientsearch/:searchTerm', routes.clientSearch);

app.get('/download/:file(*)', function (req, res, next) { // this routes all types of file
	
	//var path = require('path');
	
	var file = req.params.file
    if(file.charAt(0) !== '\\')
        file = '\\' + file;
	
	var path = 'C:\\inetpub\\wwwroot\\test\\Techlink' + file;

	//var theFileSystemRoot = "C:\\inetpub\\wwwroot\\test\\Techlink\\Beyer, Brian";

	res.sendFile(path);

});


//==========================================================================================================================
// UTILITY FUNCTIONS
//==========================================================================================================================
function existsSync(filename) {
  try {
    fs.accessSync(filename);
    return true;
  } catch(ex) {
    return false;
  }
}
function exists(filename, cb) {
  fs.access(filename, cb);
  // or if want exactly the same old API:
 //fs.access(function(err) { cb(err ? false : true); });
}

//==========================================================================================================================
// API Calls
//==========================================================================================================================

// return file/folder tree as JSON
app.get('/api/fs/:nodeID/:clientID', jsonParser, function (req, res) {
  

    fs_apis.createJsonFromFileSystem('\\', req.params.clientID, function (theAnswer) {

        res.statusCode = 200;
        res.json(theAnswer);
        res.end();
    });
});

app.post('/users', jsonParser, function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    
    db.user.create(body).then(function (user) {
        res.json(user.toPublicJSON());
        
    }, function (e) {
        res.status(400).json(e);
    });
    
});


app.post('/users/login', jsonParser, function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    
    db.user.authenticate(body).then(function(user) {
        
        var token = user.generateToken('authentication');
        if(token) {
            res.header('Auth', token).json(user.toPublicJSON());
        } else {
            res.status(401).send();
        }
        
    }, function (e) {
        
        console.log(e);
        res.status(401).send();
    });

});


//==========================================================================================================================
// DATABASE API Calls (uses lotl_api.js)
//==========================================================================================================================

// Create a new Client Message List
app.post('/api/new_client_message_list', jsonParser, routes.new_client_message_list);
//app.post('/api/new_client_message_list', jsonParser, lotl_api.newClientMessageList);

// Create a new User Message List
app.post('/api/new_user_message_list', jsonParser, routes.new_user_message_list );

// Process saving HTML from CKEditor for client notes
app.post('/api/save_message', jsonParser, routes.save_message);

// Process saving HTML from CKEditors for client db fields
app.post('/api/save_field', jsonParser, routes.save_field);

// Retrieve message item with given ID
app.post('/api/get_message_by_id', jsonParser, routes.get_message_by_id );

// Check if particular client ID exists
app.post('/api/does_client_exist/:id', jsonParser, routes.does_client_exist);
app.get('/api/does_client_exist/:id', jsonParser, routes.does_client_exist);

// Get list of recent clients viewed by a user
app.post('/api/get_recents_list/:id', jsonParser, routes.get_recents_list);
app.get('/api/get_recents_list', routes.get_recents_list_html);

// Get partial list of messages from chrono
//app.post('/api/get_chronos/:clientID/:firstChrono/:lastChrono', routes.get_chronos);
app.get('/api/get_chronos/:clientID/:firstChrono/:chronoCount', middleware.requireAuthentication, routes.get_chronos);


//==========================================================================================================================
// files to pass through statically
//==========================================================================================================================
app.use('/public/css', express.static(__dirname + '/assets/css'));
app.use('/public/templates', express.static(__dirname + '/assets/templates'));
app.use('/public/css', express.static(__dirname + '/assets/ckeditor'));
app.use('/public/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/public/js', express.static(__dirname + '/assets'));
app.use('/public/js', express.static(__dirname + '/assets/ckeditor'));
app.use('/public/js', express.static(__dirname + '/assets/bootstrap-modal'));
app.use('/public/jstree', express.static(__dirname + '/assets/jstree'));
app.use('/public/html', express.static(__dirname + '/assets/html'));
app.use('/public/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts'));
app.use('/public/css/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts'));




app.get('*', function (req, res) {
	res.send('Bad Route');
	res.end();
});


//==========================================================================================================================
// LAUNCH LISTENER
//==========================================================================================================================

db.sequelize.sync().then(function () {
	var server = app.listen(3000, function () {
		var host = server.address().address;
		var port = server.address().port;
		
		console.log('LawOfTheLamb app listening at http://%s:%s!', host, port);
	});
});

//==========================================================================================================================
//==========================================================================================================================

//==========================================================================================================================
function createBrowserObject(reqPath){
  
    var relativePath = reqPath.substring(10)
                            .replace(/\//g, "\\")
                            .replace(/\\$/, "")
                            .replace(/^\\/, "");

  relativePath = "";
  var ancestors = [];
  if(relativePath.length != 0)
  {
    ancestors = relativePath.split("\\");
  }
  
  var div_html = "";
  var theBigShit = [];
  var local_indent = ancestors.length;
  var ancestor;
  
  while(!((ancestor = ancestors.pop()) === undefined)) {
    var buttonClass = " class=\"btn btn-success\" ";
    var folderSpan = "<span class=\"glyphicon glyphicon-folder-close\" style=\"padding-right: 10px;\" aria-hidden=\"true\"></span>";
    var theLink = "<a" + buttonClass + "href=\"\\viewfiles\\" + ancestors.join("\\") + "\">" + folderSpan + ancestor + "</a>";
    div_html = "<h4 style=\"margin-left: " + local_indent*20 + "px; font-weight:bold;\">" + theLink + "</h4>" + div_html;
    local_indent--;
  };
  // display slash for root
  //div_html = "<p style=\"margin-left: 0px; font-weight:bold;\">\\</p>" + div_html;

  var theRoot = relativePath + "\\";
  if (theRoot === "\\") {
    theRoot = "";
  }
  theBigShit.push(scanFolderObject(theRoot));
  
  return theBigShit;
}


//==========================================================================================================================
// localroot is relative to file system root (has no leading '\')
function scanFolderObject(localRoot) {

  var thisFolderName = path.basename(theFileSystemRoot + localRoot);
  var localRootObject =
  {
    text: thisFolderName,
    nodes: []
  };
  
  var files = fs.readdirSync(theFileSystemRoot + localRoot);
  var actualFiles = [];
    files.forEach( function (file){
      // fullPath still relative to fs root (no leading '\')
      var fullPath = localRoot + file;
      if (fs.lstatSync(theFileSystemRoot + fullPath).isDirectory())
      {
        // entry is a folder
        localRootObject.nodes.push(scanFolderObject(fullPath + "\\"));
      }
      else
      {
        // entry is a FILE
        // save files to place after all folders
        actualFiles.push({
                          fileName: file
                        });
      }
    });
    
    // now stick the folders on
    actualFiles.forEach(function (actualFile){
                          localRootObject.nodes.push(
                                {
                                  text: actualFile.fileName,
                                  icon: "glyphicon glyphicon-file"
                                }
                          )
                       });
    
    return localRootObject;
}


