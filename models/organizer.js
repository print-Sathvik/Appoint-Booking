"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Organizer extends Model {
    static associate(models) {
      Organizer.hasMany(models.Appointment, {
        foreignKey: "organizerId",
      });
    }
  }
  Organizer.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      start: DataTypes.TIME,
      end: DataTypes.TIME,
    },
    {
      sequelize,
      modelName: "Organizer",
    }
  );
  return Organizer;
};
