module.exports = function (db) {
    
    return {
      requireAuthentication: function (req, res, next) {
          
          var token = req.get('Auth');
          
          if(token){

              console.log('Looking for user...');

              db.user.findByToken(token).then(function (user) {

                  req.user = user;
                  next();

              }, function () {
                  res.status(401).send();
              });
          } else {
              res.status(401).send();
          }
      }  
        
        
    };
    
};