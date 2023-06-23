const Tables = require("../models/tables");


const TalbeController = {
    createTable: async (req,res) => {
        let { name } = req.body,
        { user } = req;


        let newTable = await Tables.create({
            name, createdBy: user.ID
        }, { returning: true });


        return res.json({
            errCode: 200,
            data: newTable,
        });

    }
}

module.exports = TalbeController;