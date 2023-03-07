"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    static associate(models) {
      Appointment.belongsTo(models.Organizer, {
        foreignKey: "organizerId",
      });

      Appointment.belongsTo(models.Guest, {
        foreignKey: "guestId",
      });
    }

    static async addAppointment(
      organizerId,
      guestId,
      title,
      description,
      date,
      start,
      end
    ) {
      return await Appointment.create({
        organizerId,
        guestId,
        title,
        description,
        date,
        start,
        end,
      });
    }

    static async edit(id, title, description) {
      return await Appointment.update(
        { title, description },
        {
          where: {
            id,
          },
        }
      );
    }

    static async delete(id) {
      return await Appointment.destroy({
        where: {
          id,
        },
      });
    }

    static async getGuestClashes(gid, date, start, end) {
      start = start + ":00";
      end = end + ":00";
      return await Appointment.findAll({
        where: {
          guestId: gid,
          date,
          [Op.or]: [
            {
              start: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end,
                },
              },
            },
            {
              end: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end,
                },
              },
            },
            {
              [Op.and]: [
                {
                  start: {
                    [Op.lte]: start,
                  },
                },
                {
                  end: {
                    [Op.gte]: end,
                  },
                },
              ],
            },
          ],
        },
      });
    }

    static async getOrganizerClashes(oid, date, start, end) {
      start = start + ":00";
      end = end + ":00";
      return await Appointment.findAll({
        where: {
          organizerId: oid,
          date,
          [Op.or]: [
            {
              start: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end,
                },
              },
            },
            {
              end: {
                [Op.and]: {
                  [Op.gt]: start,
                  [Op.lt]: end,
                },
              },
            },
            {
              [Op.and]: [
                {
                  start: {
                    [Op.lte]: start,
                  },
                },
                {
                  end: {
                    [Op.gte]: end,
                  },
                },
              ],
            },
          ],
        },
      });
    }

    static async freeSlot(duration, allSlots) {
      let start = null;
      let end = null;
      for (let i = 0; i < allSlots.length - 1; i++) {
        const gap =
          new Date("2023-03-06" + "T" + allSlots[i + 1][0]).getTime() -
          new Date("2023-03-06" + "T" + allSlots[i][1]).getTime();
        if (gap >= duration) {
          start = allSlots[i][1];
          end = new Date(
            new Date("2023-03-06" + "T" + allSlots[i][1]).getTime() + duration
          )
            .toString()
            .slice(16, 21);
          return { start: start, end: end };
        }
      }
      return null;
    }
  }
  Appointment.init(
    {
      organizerId: DataTypes.INTEGER,
      guestId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      date: DataTypes.DATEONLY,
      start: DataTypes.TIME,
      end: DataTypes.TIME,
    },
    {
      sequelize,
      modelName: "Appointment",
    }
  );
  return Appointment;
};
