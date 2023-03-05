'use strict';
const {
  Model, Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async addAppointment(organizerId, guestId, title, description, date, start, end) {
      return await Appointment.create({
        organizerId, guestId, title, description, date, start, end
      });
    }

    static async edit(id, title, description) {
      return await Appointment.update({title, description},
        {
          where: {
            id
          }
        });
    }

    static async delete(id) {
      return await Appointment.destroy({
        where:{
          id
        }
      })
    }

    static async getGuestClashes(gid, date ,start, end) {
      start = start + ":00"
      end = end + ":00"
      return await Appointment.findAll({
        where: {
          guestId: gid,
          date,
          [Op.or]: [
            {
              start: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end
                }
              },
            },
            {
              end: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end
                }
              }
            },
            {
              [Op.and]: [
                {
                  start: {
                    [Op.lte]: start
                  }
                },
                {
                  end: {
                    [Op.gte]: end
                  }
                }
              ]
            }
          ]
        }
      })
    }

    static async getOrganizerClashes(oid, date ,start, end) {
      start = start + ":00"
      end = end + ":00"
      return await Appointment.findAll({
        where: {
          organizerId: oid,
          date,
          [Op.or]: [
            {
              start: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end
                }
              },
            },
            {
              end: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end
                }
              }
            },
            {
              [Op.and]: [
                {
                  start: {
                    [Op.lte]: start
                  }
                },
                {
                  end: {
                    [Op.gte]: end
                  }
                }
              ]
            }
          ]
        }
      })
    }
  }
  Appointment.init({
    organizerId: DataTypes.INTEGER,
    guestId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    start: DataTypes.TIME,
    end: DataTypes.TIME
  }, {
    sequelize,
    modelName: 'Appointment',
  });
  return Appointment;
};