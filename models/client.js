module.exports = function (sequelize, DataTypes) {
    
    
// ***************************************************************
// ****************  userTable  **********************************
// ***************************************************************
    
    var client = sequelize.define('client', {

        clientId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        clientName: {
            type: DataTypes.STRING(255)
        },
        clientAddress: {
            type: DataTypes.STRING(255)
        },
        clientCity: {
            type: DataTypes.STRING(255)
        },
        clientState: {
            type: DataTypes.STRING(50)
        },
        clientZip: {
            type: DataTypes.STRING(10)
        },
        clientEmailAddress: {
            type: DataTypes.STRING(80)
        },
        clientLiensNotes: {
            type: DataTypes.TEXT
        },
        clientPhoneNotes: {
            type: DataTypes.TEXT
        },
        clientHealthInsuranceNotes: {
            type: DataTypes.TEXT
        },      
        clientWorkersCompCarrierNotes: {
            type: DataTypes.TEXT
        },   
        clientTypeOfCaseNotes: {
            type: DataTypes.TEXT
        },           
        clientDOANotes: {
            type: DataTypes.TEXT
        },                  
        clientLastPaymentDateNotes: {
            type: DataTypes.TEXT
        },      
        client60LCodeNotes: {
            type: DataTypes.TEXT
        },              
        clientCaseStyleAndAttorneysNotes: {
            type: DataTypes.TEXT
        },
        clientDisabilityInsuranceNotes: {
            type: DataTypes.TEXT
        },  
        clientNoFaultCarrierNotes: {
            type: DataTypes.TEXT
        },       
        clientFaultCarrierNotes: {
            type: DataTypes.TEXT
        },
        clientDocumentationRoot: {
            type: DataTypes.TEXT
        }
    });
    

    return client;
};