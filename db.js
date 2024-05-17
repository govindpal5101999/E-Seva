const { Sequelize, Model } = require('sequelize');

const sequelize = new Sequelize('citrine', 'postgres', 'Mgtech@123', {
    host: 'localhost',
    dialect: 'postgres'
});

module.exports = sequelize;