const { Op } = require("sequelize");
const OrderDetail = require("../models/orderDetail");
const Orders = require("../models/orders");


const OrdersController = {
    createOrder: async (req,res) => {
        try {
            let { name, tableId, listProduct } = req.body,
            { user } = req;

            if (!user || !tableId) return res.json({ errCode: 400, errMsg: 'Invalid params!' });

            let newOrder = await Orders.create({
                name, tableId, createdBy: user.ID
            }, { returning: true });
            newOrder = newOrder.dataValues
            if (listProduct?.length > 0) {
                let productsCreated = []
                for (let p of listProduct) {
                    let detail = await OrderDetail.create({ orderID: newOrder.ID, productId: p.ID, quantity: p.quantity }, { returning: true });
                    productsCreated.push(detail);
                }
                newOrder.products = productsCreated
            }

            return res.json({
                errCode: 200,
                errMsg: 'Create order succes!',
                data: newOrder,
            });
        }catch(err) {
            console.log(err)
            return res.json({
                errCode: 500,
                errMsg: 'System Error!',
            });
        }
    },
    updateOrder: async (req,res) => {
        try {
            let { user } = req,
            { ID, name, tableId, listProduct } = req.body;

            if(!ID) return res.json({ errCode: 400, errMsg: 'Order not found!' });
            
            let opts = {}

            if(name) opts.name = name
            if(tableId) opts.tableId = tableId

            if(Object.keys(opts).length > 0) {
                await Orders.update(opts, {
                    where: {
                        ID
                    }
                })
            }

            if(listProduct.length > 0){
                let products = await OrderDetail.findAll({ where: {
                        orderID: ID
                    }, 
                    raw: true
                })

                if(products?.length <= 0){
                    for (let p of listProduct) {
                        await OrderDetail.create({ orderID: ID, productId: p.ID, quantity: p.quantity });
                    }
                }else {
                    let listExistProduct = products
                    for (let p of listProduct) {
                        let checkExists = listExistProduct.findIndex(pro => pro.productId === p.ID);
                        if(checkExists >= 0){
                            if (p.quantity < 1) {
                                listExistProduct.push(p)
                            }else if(p.quantity !== listExistProduct[checkExists]?.quantity) {
                                await OrderDetail.update({ quantity: p.quantity }, { where: {
                                    orderID: ID,
                                    productId: p.ID
                                }});
                            }
                            listExistProduct.splice(checkExists, 1)
                        }else {
                            await OrderDetail.create({ orderID: ID, productId: p.ID, quantity: p.quantity });
                        }
                    }
                    if(listExistProduct.length > 0) {
                        await OrderDetail.destroy({ where: {
                            orderID: ID,
                            productId: {
                                [Op.in]: listExistProduct.map(p => p.productId)
                            }
                        }});
                    }
                }
            }

            let newProducts = await OrderDetail.findAll({ where: { orderID: ID }})

            return res.json({ 
                errCode: 200,
                errMsg: 'Update success!', 
                data: {
                    ID,
                    ...opts,
                    products: newProducts
                }
            })
        }catch(err) {
            console.log(err)
            return res.json({ 
                errCode: 500,
                errMsg: 'System error!', 
            })
        }
    }
}

module.exports = OrdersController;