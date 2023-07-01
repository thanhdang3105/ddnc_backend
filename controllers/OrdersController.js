const { Op } = require("sequelize");
const OrderDetail = require("../models/orderDetail");
const Orders = require("../models/orders");
const Products = require("../models/products");


const OrdersController = {
    createOrder: async (req, res) => {
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
        } catch (err) {
            console.log(err)
            return res.json({
                errCode: 500,
                errMsg: 'System Error!',
            });
        }
    },
    updateOrder: async (req, res) => {
        try {
            let { user } = req,
                { ID, name, tableId, listProduct } = req.body;

            if (!ID) return res.json({ errCode: 400, errMsg: 'Order not found!' });

            let opts = {}

            if (name) opts.name = name
            if (tableId) opts.tableId = tableId

            if (Object.keys(opts).length > 0) {
                await Orders.update(opts, {
                    where: {
                        ID
                    }
                })
            }

            if (listProduct.length > 0) {
                let products = await OrderDetail.findAll({
                    where: {
                        orderID: ID
                    },
                    raw: true
                })

                if (products?.length <= 0) {
                    for (let p of listProduct) {
                        await OrderDetail.create({ orderID: ID, productId: p.ID, quantity: p.quantity });
                    }
                } else {
                    let listExistProduct = products
                    for (let p of listProduct) {
                        let checkExists = listExistProduct.findIndex(pro => pro.productId === p.ID);
                        if (checkExists >= 0) {
                            if (p.quantity < 1) {
                                listExistProduct.push(p)
                            } else if (p.quantity !== listExistProduct[checkExists]?.quantity) {
                                await OrderDetail.update({ quantity: p.quantity }, {
                                    where: {
                                        orderID: ID,
                                        productId: p.ID
                                    }
                                });
                            }
                            listExistProduct.splice(checkExists, 1)
                        } else {
                            await OrderDetail.create({ orderID: ID, productId: p.ID, quantity: p.quantity });
                        }
                    }
                    if (listExistProduct.length > 0) {
                        await OrderDetail.destroy({
                            where: {
                                orderID: ID,
                                productId: {
                                    [Op.in]: listExistProduct.map(p => p.productId)
                                }
                            }
                        });
                    }
                }
            }

            let newProducts = await OrderDetail.findAll({ where: { orderID: ID } })

            return res.json({
                errCode: 200,
                errMsg: 'Update success!',
                data: {
                    ID,
                    ...opts,
                    products: newProducts
                }
            })
        } catch (err) {
            console.log(err)
            return res.json({
                errCode: 500,
                errMsg: 'System error!',
            })
        }
    },
    changeStatusOrder: async (req, res) => {
        try {
            let { ID, status } = req.body;
            if (!ID) return res.json({ errCode: 401, errMsg: 'Order not found!' });
            if (!['started', 'inProgess', 'finished', 'cancelled'].includes(status)) return res.json({ errCode: 401, errMsg: 'Status is not support!' });

            let orderUpdated = await Orders.update({ status }, { where: { ID } })
            console.log(orderUpdated);
            return res.json({ errCode: 200, errMsg: 'Status updated' });
        } catch (err) {

        }
    },
    getByTableID: async (req, res) => {
        try {
            let { ID } = req.params

            if (!ID) return res.json({ errCode: 400, errMsg: 'Table not found!' });

            let listOrders = await Orders.findAll({
                where: {
                    tableId: ID,
                }, raw: true
            })
            for (let order of listOrders) {
                if (order?.ID) {
                    let details = await OrderDetail.findAll({
                        where: {
                            orderID: order.ID
                        }, raw: true
                    })
                    let listProduct = []
                    for (let detail of details) {
                        if (detail?.productId) {
                            let product = await Products.findOne({
                                where: {
                                    ID: detail.productId
                                }, raw: true
                            })
                            listProduct.push({
                                ...product,
                                quantity: detail.quantity
                            })
                        }
                    }
                    order.products = listProduct
                }
            }

            return res.json({ errCode: 200, errMsg: 'Success!', data: listOrders })
        } catch (err) {
            console.log(err)
            return res.json({ errCode: 500, errMsg: 'System error!' })

        }
    },
    getAllOrders: async (req, res) => {
        try {
            let listOrders = await Orders.findAll({
                raw: true
            })
            let total = 0
            for (let order of listOrders) {
                if (order?.ID) {
                    let totalRevenue = 0
                    let details = await OrderDetail.findAll({
                        where: {
                            orderID: order.ID
                        }, raw: true
                    })
                    for (let detail of details) {
                        if (detail?.productId) {
                            let product = await Products.findOne({
                                where: {
                                    ID: detail.productId
                                }, raw: true
                            })
                            if (product) {
                                totalRevenue += product.price * detail.quantity
                            }
                        }
                    }
                    total += totalRevenue
                }
            }

            return res.json({ errCode: 200, errMsg: 'Success!', data: listOrders, totalRevenue: total })
        } catch (err) {
            console.log(err)
            return res.json({ errCode: 500, errMsg: 'System error!' })

        }
    },
    getOrderByID: async (req, res) => {
        try {
            let { ID } = req.params

            if (!ID) return res.json({ errCode: 400, errMsg: 'Order not found!' });

            let listOrders = await Orders.findOne({
                where: {
                    ID: ID,
                }, raw: true
            })
            // if (ID) {
            //     let details = await OrderDetail.findAll({
            //         where: {
            //             orderID: order.ID
            //         }, raw: true
            //     })
            //     let listProduct = []
            //     for (let detail of details) {
            //         if (detail?.productId) {
            //             let product = await Products.findOne({
            //                 where: {
            //                     ID: detail.productId
            //                 }, raw: true
            //             })
            //             listProduct.push({
            //                 ...product,
            //                 quantity: detail.quantity
            //             })
            //         }
            //     }
            //     order.products = listProduct
            // }

            return res.json({ errCode: 200, errMsg: 'Success!', data: listOrders })
        } catch (err) {
            console.log(err)
            return res.json({ errCode: 500, errMsg: 'System error!' })

        }
    },
    getDetailOrder: async (req, res) => {
        try {
            let { ID } = req.params

            if (!ID) return res.json({ errCode: 400, errMsg: 'Table not found!' });

            let details = await OrderDetail.findAll({
                where: {
                    orderID: ID
                }, raw: true
            })
            let listProduct = []
            for (let detail of details) {
                if (detail?.productId) {
                    let product = await Products.findOne({
                        where: {
                            ID: detail.productId
                        }, raw: true
                    })
                    listProduct.push({
                        ...product,
                        quantity: detail.quantity
                    })
                }
            }
            return res.json({ errCode: 200, errMsg: 'Success!', data: listProduct })
        } catch (err) {
            console.log(err)
            return res.json({ errCode: 500, errMsg: 'System error!' })
        }
    }
}

module.exports = OrdersController;