// const newRouter = require('./news');
// const siteRouter = require('./site');
// const courseRouter = require('./courses');
// const meRouter = require('./me');

const heplers = require("../helpers");
const Users = require("../model/user");

function routes(app){

    // app.use('/news', newRouter);
    
    // app.use('/courses', courseRouter);

    // app.use('/me', meRouter)

    app.get('/testService', (req,res) => {
        res.status(200).json({ message: 'Connect service ok!' });
    })

    app.post('/registerAccount', async (req, res) => {
        try{
            let { email, password, name } = req.body
            if(!email && !password && !name) return res.status(500).json({ message: 'Invalid params!'})
            const regexEmail = new RegExp(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,'g');
            if(regexEmail.test(email)){
                const accessToken = heplers.generateAccessToken({ email })
                let userCreated = await Users.create({name, email, password, token: accessToken},{ returning: true })
                res.status(200).json({
                    message: 'Register Account Success!',
                    data: userCreated
                })
            }else {
                return res.status(500).json({ message: 'Email wrong format!' })
            }
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Register Account failed!'})
        }
    })

    app.use('/', (req,res) => {
        res.status(200).json({ message: 'Connected to Service!' });
    });

    
}

module.exports = routes;