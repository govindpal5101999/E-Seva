const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Images = sequelize.define('image', {
        data: {
            type: DataTypes.BLOB('long'),
            allowNull: false
        }
    },
    {
        timestamps: false
    }
    );

    return Images
}