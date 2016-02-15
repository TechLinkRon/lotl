var sqlite3 = require('sqlite3').verbose();
var db;

exports.get = function(req, res){
 //console.log("Serving " + __filename);
 
 var db_name = 'testdb.sqlite';
 var table = 'notes';
 
 var dbpath = db_name;
 db = new sqlite3.Database(dbpath, function(err){
   
 });
 
 db.all(" select * from " + table, function(err, rows) {
        
        var message = rows.length > 0 ? "Viewing " 
             + db_name + '/' + table 
             : "No data found in table '" + table + "' in " + db_name;
        
        //res.render('table_view', {message: message, rows: rows});
        console.log(rows);
        
  var retJSON = { existance : message};
  res.statusCode = 200;
  res.json(retJSON);
  res.end();


        db.close();
    });
};