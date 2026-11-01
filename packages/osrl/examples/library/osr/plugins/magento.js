const parts = (user, password, url, category, context) => {
    return new Promise((resolve, reject) => {
        context.Magento.Magento.init(url, user, password).then(() => {
            const productsAPI = new context.Magento.API.CatalogProductRepositoryV1Api(context.Magento.Magento.apiConfig);
            productsAPI.catalogProductRepositoryV1GetListGet('category_id', "" + category).then((products) => {
                resolve(products.items);
            })
        });
    });
}
module.exports = {
    magento: {
        parts: parts
    }
};