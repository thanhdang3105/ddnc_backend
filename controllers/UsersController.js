const Users = require("../models/users");
const { checkEmail, handleAccessToken, hashPassword, comparePassword } = require("../helpers");
const { handleAccessToken: { verify } } = require('../helpers');
const { Op, where } = require("sequelize");


const UsersController = {
    loginWithToken: async (req, res) => {
        try {
            let { token } = req.params;
            if (!token) return res.json({errCode: 500, errMsg: 'Invalid token!'});
            let verifyToken = verify(token)
            if (verifyToken?.errCode === 0) {
                let { info } = verifyToken;
                if(!info?.email || (info?.email && (info.email !== 'ROOT' && !checkEmail(info.email)))){
                    return res.json({errCode: 401, errMsg: "Token is wrong!"});
                }
                const user = await Users.findOne({
                    where: {
                        email: info.email
                    }, raw: true
                })
                if(!user){
                    return res.json({errCode: 401, errMsg: "User not found!"});
                }
                return res.json({errCode: 200, errMsg: "Login Success!", data: user});
            }
            return res.json({errCode: 500, errMsg: 'Login failed!'});
        } catch (e) {
            console.log(e);
            return res.json({errCode: 500, errMsg: 'Login failed!'});
        }
    },
    register: async (req, res) => {
        try{
            let { email, password, name, role } = req.body
            if(!email && !password && !name) return res.json({ errCode: 500, errMsg: 'Invalid params!'});
            
            if(checkEmail(email)){
                if(!['employee','manager','admin'].includes(role)){
                    role = 'employee';
                }
                let passwordHash = hashPassword(password)
                if(!passwordHash) return res.json({ errCode: 500, errMsg: 'System Error!'});
                let userCreated = await Users.create({name, email, password: passwordHash, role},{ returning: true });
                userCreated = userCreated.dataValues
                delete userCreated.password
                res.json({
                    errCode: 200,
                    errMsg: 'Register Account Success!',
                    data: userCreated
                })
            }else {
                return res.json({ errCode: 500, errMsg: 'Email wrong format!' });
            }
        }catch(err){
            console.log(err);
            return res.json({errCode: 500, errMsg: 'Register Account failed!'});
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
            return res.json({errCode: 500, errMsg: 'Login failed!'})
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
                let userUpdated = await Users.update(opts, { where: { ID: user.ID } })
                if(userUpdated[0]) {
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
    lockOrUnlockUser: async (req,res) => {
        try {
            let { ID } = req.params,
            { isLocked } = req.body
            if(!ID) return res.json({errCode: 404, errMsg: 'User not found!'});
            if (![true, false].includes(isLocked)) return res.json({errCode: 404, errMsg: 'System error!'});

            let user = await Users.update({ locked: isLocked },{ where: { ID }})
            if (user[0]) {
                return res.json({errCode: 200, errMsg: `${isLocked ? 'User is locked!' : 'User is unlocked'}`});
            } else {
                return res.json({errCode: 401, errMsg: `${isLocked ? 'User locked' : 'User unlocked'} failed!`});
            }
        }catch (err) {
            console.log(err);
            return res.json({errCode: 500, errMsg: 'System error!'});
        }
    },
    getAllUsers: async (req, res) => {
        try {
            let { user } = req;
            if (!user) return res.json({errCode: 401, errMsg: 'Forbidden!'});
            let opts = {
                role: 'employee',
            }
            if (user.role === 'admin') {
                opts.role = { [Op.in]: ['employee', 'manager'] }
            }
            const listUsers = await Users.findAll({ where: opts, raw: true, attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });

            return res.json({errCode: 200, errMsg: `Successfully!`, data: listUsers});

        } catch(err) {
            console.log(err);
            return res.json({errCode: 500, errMsg: 'System error!'});
        }
    },
    resetPassword: async (req, res) => {
        try {
            let { ID } = req.params;
            if (!ID) return res.json({errCode: 401, errMsg: 'User not found!'});

            const newPWD = Math.random().toString(36).slice(-6);

            const pwdHash = hashPassword(newPWD);

            let updated = await Users.update({ password: pwdHash }, {
                where: {
                    ID
                }
            })

            if (updated[0]){
                return res.json({errCode: 200, errMsg: `Successfully!`, data: newPWD});
            } else {
                return res.json({errCode: 401, errMsg: `Reset password failed!`});
            }
        } catch(err) {
            console.log(err);
            return res.json({errCode: 500, errMsg: 'System error!'});
        }
    }
}

module.exports = UsersController;