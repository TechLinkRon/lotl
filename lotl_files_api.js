var fs = require('fs');
var path = require('path');
var theFileSystemRoot = "C:\\inetpub\\wwwroot\\test\\Techlink";
var lotl_api = require('./lotl_api.js');


//==========================================================================================================================
function createBrowserObject(reqPath) {
	
	var relativePath = reqPath.substring(10)
                            .replace(/\//g, "\\")
                            .replace(/\\$/, "")
                            .replace(/^\\/, "");
	
	relativePath = "";
	var ancestors = [];
	if (relativePath.length != 0) {
		ancestors = relativePath.split("\\");
	}
	
	var div_html = "";
	var theBigShit = [];
	var local_indent = ancestors.length;
	var ancestor;
	
	while (!((ancestor = ancestors.pop()) === undefined)) {
		var buttonClass = " class=\"btn btn-success\" ";
		var folderSpan = "<span class=\"glyphicon glyphicon-folder-close\" style=\"padding-right: 10px;\" aria-hidden=\"true\"></span>";
		var theLink = "<a" + buttonClass + "href=\"\\viewfiles\\" + ancestors.join("\\") + "\">" + folderSpan + ancestor + "</a>";
		div_html = "<h4 style=\"margin-left: " + local_indent * 20 + "px; font-weight:bold;\">" + theLink + "</h4>" + div_html;
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


exports.createJsonFromFileSystem = function (targetFolder, clientId, callMeBack) {

    lotl_api.getClientInfo(clientId, function (err, clientInfo) {

        var theClientRoot = clientInfo.clientDocumentationRoot;
        
        var theJSON = scanFolderObject(theClientRoot);
        
        callMeBack(theJSON);
    
    });
    
    
	
	
}

//==========================================================================================================================
function scanFolderObject(localRoot) {
	
	var fullPathToLocalRoot = theFileSystemRoot + localRoot;
	var thisFolderName = path.basename(fullPathToLocalRoot);
	var localRootObject =
	 {
		text: thisFolderName,
		a_attr: {
			nodePath: localRoot,
			nodeType: 'folder'
		},
		icon : "/public/css/folder24x24.png",
		children: []
	};
	if (localRoot === '\\')
		localRootObject.state = { opened: true };
	
	var files = fs.readdirSync(theFileSystemRoot + localRoot);
	var theFolderChildren = [];
	var theFileChildren = [];
	files.forEach(function (file) {
		// fullLocalPath still relative to fs root (no leading '\')
		var fullLocalPath = localRoot + file;
		if (fs.lstatSync(theFileSystemRoot + fullLocalPath).isDirectory()) {
			// entry is a folder
			theFolderChildren.push(scanFolderObject(fullLocalPath + "\\"));
		}
		else {
			// entry is a FILE
			// save files to place after all folders
			var fileNodeObject = {
				text: file,
				a_attr: {
					nodePath: '\\download' + fullLocalPath,
					nodeType: 'file'
				}
			};
			fileNodeObject.icon = iconPathFinder(fullLocalPath);

			theFileChildren.push(fileNodeObject);
		}
	});
	
	// group all folders before file entries
	localRootObject.children = theFolderChildren.concat(theFileChildren);
	
	return localRootObject;
}


function iconPathFinder(filePath) {

	var extensionThree = filePath.slice(-3);
	var extensionFour = filePath.slice(-4);
	
	if (extensionFour === '.doc')
		return "/public/css/word48x48.png";

	if (extensionFour === '.pdf')
		return "/public/css/pdf48x48.png";

	return null;
}

// Expected format of the node (there are no required fields)
//{
//	id          : "string" // will be autogenerated if omitted
//	text        : "string" // node text
//	icon        : "string" // string for custom
//	state       : {
//		opened    : boolean  // is the node open
//		disabled  : boolean  // is the node disabled
//		selected  : boolean  // is the node selected
//	},
//	children    : []  // array of strings or objects
//	li_attr     : { }  // attributes for the generated LI node
//	a_attr      : { }  // attributes for the generated A node
//}