var http = require('http');
var fs = require('fs');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();
var jsonParser = bodyParser.json()

var theFileSystemRoot = "c:\\inetpub\\wwwroot\\gabe-before-express\\";


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

/*
If you want to do more, here's the full node specification

```javascript
{
  text: "Node 1",
  icon: "glyphicon glyphicon-stop",
  selectedIcon: "glyphicon glyphicon-stop",
  color: "#000000",
  backColor: "#FFFFFF",
  href: "#node-1",
  selectable: true,
  state: {
    checked: true,
    disabled: true,
    expanded: true,
    selected: true
  },
  tags: ['available'],
  nodes: [
    {},
    ...
  ]
}
*/

app.get('/api/fs', jsonParser, function (req, res) {


  var theAnswer;
  
  //theAnswer = '[{"text": "Parent 1","nodes": [{"text": "Child 1","tags": ["2 items"],"nodes": [{"text": "Grandchild 1"},{"text": "Grandchild 2"}]},{"text": "Child 2"}]},{"text": "Parent 2"},{"text": "Parent 3"},{"text": "Parent 4"},{"text": "Parent 5"}]'
/*
	theAnswer =
  {
    text: "Root Node",
    tags: ['the tag']
  };
  
  theAnswer.nodes =
  [
    {
      text: "First Child",
      icon: "glyphicon glyphicon-file"
    },
    {
      text: "Second Child",
      icon: "glyphicon glyphicon-file"
    }
  ];
  
  theAnswer.nodes[1].icon = "";
  theAnswer.nodes[1].nodes =
  [
    {
      text: "Grandchild",
      icon: "glyphicon glyphicon-file"
    }
  ];
*/

  theAnswer = createBrowserObject(req.path);
  
  res.statusCode = 200;
	res.json(theAnswer);
	res.end();
});

app.get('/viewfiles*', function (req, res) {
  res.statusCode = 200;
  var html;
  
  html = createBrowserDiv(req.path);

  var html_head = "";
  html_head += "<!DOCTYPE html>";
  html_head += "<html lang=\"en\">";
  html_head += "  <head>";
  html_head += "    <meta charset=\"utf-8\">";
  html_head += "    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">";
  html_head += "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">";
  html_head += "    <link href=\"/public/css/bootstrap.min.css\" rel=\"stylesheet\">";
  html_head += "  </head>";
  html_head += "  <body>";
  
    
  var html_tail = "";
  html_tail += "  <script src=\"https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js\"></script>";
  html_tail += "    <script src=\"/public/js/bootstrap.min.js\"></script>";
  html_tail += "  </body>";
  html_tail += "</html>";
  
  var full_html = html_head + "<div class=\"container\">" + html + "</div>" + html_tail;
  
  res.end(full_html);

});


// files to pass through statically
app.use('/public/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/public/css', express.static(__dirname + '/assets'));
app.use('/public/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/public/js', express.static(__dirname + '/assets'));
app.use('/public/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts'));

var server = app.listen(3000, function () {
var host = server.address().address;
var port = server.address().port;

  console.log('LawOfTheLamb app listening at http://%s:%s', host, port);
});


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
  var indent = local_indent + 1;
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




function createBrowserDiv(reqPath){
  
    var relativePath = reqPath.substring(10)
                            .replace(/\//g, "\\")
                            .replace(/\\$/, "")
                            .replace(/^\\/, "");

  var ancestors = [];
  if(relativePath.length != 0)
  {
    ancestors = relativePath.split("\\");
  }
  
  var div_html = "";
  var local_indent = ancestors.length;
  var indent = local_indent + 1;
  var ancestor;
  
  while(!((ancestor = ancestors.pop()) === undefined)) {
    var buttonClass = " class=\"btn btn-success\" ";
    var folderSpan = "<span class=\"glyphicon glyphicon-folder-close\" style=\"padding-right: 10px;\" aria-hidden=\"true\"></span>";
    var theLink = "<a" + buttonClass + "href=\"\\viewfiles\\" + ancestors.join("\\") + "\">" + folderSpan + ancestor + "</a>";
    div_html = "<h4 style=\"margin-left: " + local_indent*20 + "px; font-weight:bold;\">" + theLink + "</h4>" + div_html;
    local_indent--;
  };
  // display slash for root
  div_html = "<p style=\"margin-left: 0px; font-weight:bold;\">\\</p>" + div_html;

  var theRoot = relativePath + "\\";
  if (theRoot === "\\") {
    theRoot = "";
  }
  div_html = scanFolder(div_html, theRoot, indent);
  
  return "<div>" + div_html + "</div>";
}





// localroot is relative to file system root (has no leading '\')
function scanFolder(div_html, localRoot, indent) {

  var files = fs.readdirSync(theFileSystemRoot + localRoot);
  var actualFiles = [];
    files.forEach( function (file){
      
      // fullPath still relative to fs root (no leading '\')
      var fullPath = localRoot + file;
      if (fs.lstatSync(theFileSystemRoot + fullPath).isDirectory())
      {
        // entry is a folder
        var buttonClass = " class=\"btn btn-success\" ";
        var folderSpan = "<span class=\"glyphicon glyphicon-folder-close\" style=\"padding-right: 10px;\" aria-hidden=\"true\"></span>";
        div_html += "<h4 style=\"margin-left: " + indent*20 + "px; font-weight:bold;\"><a" + buttonClass + "href=\"\\viewfiles\\";
        div_html += fullPath + "\">" + folderSpan + file + "</a></h4>";
        scanFolder(div_html, fullPath + "\\", indent + 1);
      }
      else
      {
        // entry is a FILE
        // save files to place after all folders
        actualFiles.push({
                          indent: indent * 20,
                          fileName: file
                        });
      }
    });
    
    // now stick the folders on
    actualFiles.forEach(function (actualFile){
        var buttonClass = " class=\"btn btn-info\" ";
        var fileSpan = "<span class=\"glyphicon glyphicon-file\" style=\"padding-right: 10px;\" aria-hidden=\"true\"></span>";
        div_html += "<p style=\"margin-left: " + actualFile.indent + "px;\"><button" + buttonClass + ">" + fileSpan + actualFile.fileName + "</button></p>";   
    });
    
    return div_html;
}

