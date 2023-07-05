const Users = require("../models/users");
const { checkEmail, handleAccessToken, hashPassword, comparePassword } = require("../helpers");


const UsersController = {
    register: async (req, res) => {
        try{
            let { email, password, name, role } = req.body
            if(!email && !password && !name) return res.json({ errCode: 500, errMsg: 'Invalid params!'})
            
            if(checkEmail(email)){
                if(!['employee','manager','admin'].includes(role)){
                    role = 'employee';
                }
                const accessToken = handleAccessToken.generate({ email, role })
                let passwordHash = hashPassword(password)
                if(!passwordHash) return res.json({ errCode: 500, errMsg: 'System Error!'})
                let userCreated = await Users.create({name, email, password: passwordHash, role},{ returning: true })
                userCreated = userCreated.dataValues
                delete userCreated.password
                userCreated.token = accessToken
                res.json({
                    errCode: 200,
                    errMsg: 'Register Account Success!',
                    data: userCreated
                })
            }else {
                return res.json({ errCode: 500, errMsg: 'Email wrong format!' })
            }
        }catch(err){
            console.log(err);
            res.json({errCode: 500, errMsg: 'Register Account failed!'})
        }
    },
    login: async (req,res) => {
        try{
            let { email, password } = req.body
            if(!email && !password) return res.json({ errCode: 500, errMsg: 'Invalid params!'})
            if(email === 'ROOT' || checkEmail(email)){
                let user = await Users.findOne({ where: { email }})
                if(!user || !comparePassword(password, user.password)) {
                    return res.json({ errCode: 401, errMsg: 'Invalid email or password!' })
                }else {
                    const accessToken = handleAccessToken.generate({ email, role: user.role })
                    user = user.dataValues
                    user.token = accessToken
                    delete user.password
                    return res.json({
                        errCode: 200,
                        errMsg: 'Login Success!',
                        data: user
                    })
                }
            }else {
                return res.json({ errCode: 500, errMsg: 'Email wrong format!' })
            }
        }catch(err){
            console.log(err);
            res.json({errCode: 500, errMsg: 'Login failed!'})
        }
    },
    updateProfile: async (req,res) => {
        try {
            let { user } = req,
            { name, password, currentPWD } = req.body
            
            if(!name && !password){
                return res.json({ errCode: 500, errMsg: 'Invalid params!'}) 
            }

            let opts = {}

            if(name) {
                opts.name = name
            }
            if(password) {
                if (!comparePassword(currentPWD, user.password)) {
                    return res.json({ errCode: 401, errMsg: 'Invalid current password!' })
                }
                let passwordHash = hashPassword(password)
                if(!passwordHash) return res.json({ errCode: 500, errMsg: 'System Error!'})
                opts.password = passwordHash
            }

            if(Object.keys(opts).length > 0) {
                let userUpdated = await Users.update(opts, { where: { ID: user.ID }, returning: true })
                if(userUpdated[1] === 1) {
                    return res.json({
                        errCode: 200,
                        errMsg: 'Update success!',
                    })
                }
            }

            return res.json({
                errCode: 401,
                errMsg: 'Update failed!'
            })
        }catch(err) {
            console.log(err)
            return res.json({errCode: 500, errMsg: "System Error!"});
        }
    },
    updateRole: async (req,res) => {
        try {
            let { ID, role } = req.body;

            if(!ID) return res.json({errCode: 401, errMsg: 'User not found!'});

            if (!['employee','manager','admin'].includes(role)){
                return res.json({errCode: 401, errMsg: 'Invalid role!'});
            }

            await Users.update({ role }, { where: { ID }})

            return res.json({errCode: 200, errMsg: 'Update success, now user is: ' + role})
        }catch(err) {
            return res.json({ errCode: 500, errMsg: 'System Error!' });
        }
    },
    deleteUser: async (req,res) => {
        try {
            let { ID } = req.params
    
            if(!ID) return res.json({errCode: 404, errMsg: 'Delete User Failed!'});
    
            await Users.destroy({ where: { ID }})
    
            return res.json({errCode: 200, errMsg: `Delete User: ${ID} successfully!`});
        }catch (err) {
            console.log(err);
            return res.json({errCode: 500, errMsg: 'System error!'});
        }
    }
}

module.exports = UsersController;