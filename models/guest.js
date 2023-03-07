"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Guest extends Model {
    static associate(models) {
      Guest.hasMany(models.Appointment, {
        foreignKey: "guestId",
      });
    }
  }
  Guest.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Guest",
    }
  );
  return Guest;
};
