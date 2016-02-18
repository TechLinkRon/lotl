var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptjs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function (sequelize, DataTypes) {
    
    
// ***************************************************************
// ****************  userTable  **********************************
// ***************************************************************
    
return sequelize.define('user', {
    
	userID: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
	},
    salt: {
        type: DataTypes.STRING
    },
    password_hash: {
        type: DataTypes.STRING
    },
	password: {
		type: DataTypes.VIRTUAL,
        allowNull: false,
        validate: {
            len: [5, 100]
        },
        set: function (value) {
            var salt = bcrypt.genSaltSync(10);
            var hashedPassword = bcrypt.hashSync(value, salt);
            
            this.setDataValue('password', value);
            this.setDataValue('salt', salt);
            this.setDataValue('password_hash', hashedPassword);
        }
	},
	firstName: {
		type: DataTypes.STRING(50)
	},
	lastName: {
		type: DataTypes.STRING(50)
	},
	lastLogin: {
		type: DataTypes.DATE
	}
}, {
    hooks: {
        beforeValidate: function (user, options) {
            
            if(typeof user.email === 'string') {
                user.email = user.email.toLowerCase();
            }
        }
    },
    instanceMethods:  {
        toPublicJSON: function () {
            var json = this.toJSON();
            
            return _.pick(json, 'userID', 'createdAt', 'updatedAt', 'email');
            
        },
        generateToken: function (type) {
            if(!_.isString(type)) {
                return undefined;
            }
            
            try {
                var stringData = JSON.stringify({id: this.get('id'), type: type});
                var encryptedData = cryptjs.AES.encrypt(stringData, 'abc123&^%').toString();
                
                var token = jwt.sign({
                    token: encryptedData
                }, 'qwerty0998');
                
                return token;
                
            } catch (e) {
                return undefined;
            }
        }
    },
    classMethods: {
        authenticate: function(body) {
            return new Promise(function(resolve, reject) {
                 if((typeof body.email !== 'string') || (typeof body.password !== 'string')) {
                    reject();
                } 
                db.user.findOne({
                    where: {
                        email: body.email
                    }
                }).then(function (user) {
                    if(!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
                        reject();
                    } 
                    resolve(user);
                }, function(e) {
                    reject();
                });
            });
        }
    }
});

}