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
    },
    getAll: async (req, res) => {
        try {
            let listTables = await Tables.findAll({ where: {}})
            return res.json({
                errCode: 200,
                errMsg: 'Success',
                data: listTables
            })
        } catch(err) {
            console.log(err);
            return res.json({
                errCode: 500,
                errMsg: 'System error!',
            })
        }
    }
}

module.exports = TalbeController;