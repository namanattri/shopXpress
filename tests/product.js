/**
 * contains test cases for product module
 */
const request = require('supertest')
const _ = require('lodash')
const expectations = require('./commons/expectations')

module.exports = (app) => {
  test("it should respond with status true, created successfully message and the created product", async () => { 
    const product = {
      sku: 'sku-1',
      title: 'title-1',
      description: 'description-1',
      qty: 10
    }
    const response = await request(app).post("/products").send(product)
    expectations.apiBasic(response)
    expectations.statusAndMessage(response, true, "Product with sku: sku-1 created successfully!")
    expect(_.pick(response.body.product, ['sku', 'title', 'description', 'qty'])).toEqual(product)
  })

  test("it should respond with status false and sku already exists message", async () => {
    const product = {
      sku: 'sku-1',
      title: 'title-1',
      description: 'description-1',
      qty: 10
    }
    const response = await request(app).post("/products").send(product)
    expectations.apiBasic500(response)
    expectations.statusAndMessage(response, false, "Product with sku: sku-1 already exist!")
  })

  test("it should respond with status true, showing product with sku message and the matching product", async () => { 
    const response = await request(app).get("/products/sku-1")
    expectations.apiBasic(response)
    expectations.statusAndMessage(response, true, "Showing product with sku: sku-1")
    expect(_.pick(response.body.product, ['sku', 'title', 'description', 'qty'])).toEqual({
      sku: 'sku-1',
      title: 'title-1',
      description: 'description-1',
      qty: 10
    })
  })

  test("it should respond with status true, product with sku updated message and the updated product", async () => { 
    updatedProduct = { //fields to be updated
      title: 'title-1-updated',
      description: 'description-1-updated-2',
      qty: 15
    }
    var response = await request(app).put("/products/sku-1").send(updatedProduct)
    expectations.apiBasic(response)
    expectations.statusAndMessage(response, true, "Product with sku: sku-1 updated!")
    expect(_.pick(response.body.product, _.keys(updatedProduct))).toEqual(updatedProduct)
  })

    //update only 1 field
  test("it should update only 1 field and respond with status true, product with sku updated message and the updated product", async () => {
    updatedProduct = { //fields to be updated
      qty: 10
    }
    response = await request(app).put("/products/sku-1").send(updatedProduct)
    expectations.apiBasic(response)
    expectations.statusAndMessage(response, true, "Product with sku: sku-1 updated!")
    expect(_.pick(response.body.product, _.keys(updatedProduct))).toEqual(updatedProduct)
  })

  test("it should delete the product with supplied sku and respond with status true and product with sku deleted message", async () => { 
    const response = await request(app).delete("/products/sku-1").send(updatedProduct)
    expectations.apiBasic(response)
    expectations.statusAndMessage(response, true, "Product with sku: sku-1 deleted!")
  })

  test("it should respond with status false and product with sku doesn't exist for get call on non-existing sku", async () => {
    const response = await request(app).get("/products/sku-5")
    nonExistentExpectations(response)
  })
  
  test("it should respond with status false and product with sku doesn't exist for put call on non-existing sku", async () => {
    const response = await request(app).put("/products/sku-5")
    nonExistentExpectations(response)
  })

  test("it should respond with status false and product with sku doesn't exist for delete call on non-existing sku", async () => {
    const response = await request(app).delete("/products/sku-5")
    nonExistentExpectations(response)
  })

  function nonExistentExpectations(response) {
    expectations.apiBasic(response)
    expectations.statusAndMessage(response, false, "Product with sku: sku-5 doesn't exist!")
  }

  describe("fetch available products when there are no products in database", () => {
    test("it should return an empty set with pagination showing default values for page and pageSize respectively", async () => { 
      const response = await request(app).get('/products') //no request parameters & query parameters specified
      
      expectations.apiBasic(response)
      expectations.statusAndMessage(response, true, "Showing available products")
      expect(response.body.products).toEqual([]) //not products currently in the database
      expect(response.body.pagination).toEqual({
        page: 1, //default page
        totalPages: 0,
        pageSize: 100, //default size
        total: 0, //available products count
        showing: 0 //retrieved products count
      })
    })

    test("it should return an empty set with pagination showing supplied values in query string for page and pageSize respectively", async () => {
      const response = await request(app).get('/products/?page=3&size=200') //query parameters specified
      
      expectations.apiBasic(response)
      expectations.statusAndMessage(response, true, "Showing available products")
      expect(response.body.products).toEqual([]) //not products currently in the database
      expect(response.body.pagination).toEqual({
        page: 3, //default page
        totalPages: 0,
        pageSize: 200, //default size
        total: 0, //available products count
        showing: 0 //retrieved products count
      })
    })
  })

  describe("create products in loop", () => {
    test("it should successfully create all products from the supplied data file in loop", async () => { 
      for(product of require('./data/products')) {
        const response = await request(app).post('/products').send(product)
        expectations.apiBasic(response)
        expectations.statusAndMessage(response, true, "Product with sku: "+product.sku+" created successfully!")
        expect(_.pick(response.body.product, ['sku', 'title', 'description', 'qty'])).toEqual(product)
      }
    })
  })

  describe("fetch available products when there are products in database", () => {
    test("its should retrieve multiple products in the form of an array and pagination must reflect default page number and size", async () => {
      const response = await request(app).get('/products') //no request parameters & query parameters specified
      
      expectations.apiBasic(response)
      expectations.statusAndMessage(response, true, "Showing available products")
      expect(_.map(response.body.products, product => _.pick(product, ['sku', 'title', 'description', 'qty']))).toEqual(require("./data/products")) //not products currently in the database
      expect(response.body.pagination).toEqual({
        page: 1, //default page
        totalPages: 1,
        pageSize: 100, //default size
        total: 10, //available products count
        showing: 10 //retrieved products count
      })
    })

    test("it should return an empty array as no products exist at supplied page number and pagination must reflect supplied page number and size", async () => {
      const response = await request(app).get('/products/?page=3&size=200') //query parameters specified
      
      expectations.apiBasic(response)
      expectations.statusAndMessage(response, true, "Showing available products")
      expect(_.map(response.body.products, product => _.pick(product, ['sku', 'title', 'description', 'qty']))).toEqual([]) //not products at page 3
      expect(response.body.pagination).toEqual({
        page: 3, 
        totalPages:1,
        pageSize: 200,
        total: 10, //available products count
        showing: 0 //retrieved products count
      })
    })

    test("it should return an array of products with length equal to supplied page size and pagination must reflect supplied page number and size", async () => {
      response = await request(app).get('/products/?page=1&size=5') //query parameters specified
      
      expectations.apiBasic(response)
      expectations.statusAndMessage(response, true, "Showing available products")
      expect(_.map(response.body.products, product => _.pick(product, ['sku', 'title', 'description', 'qty']))).toEqual(_.slice(require('./data/products'), 0, 5)) //not products at page 3
      expect(response.body.pagination).toEqual({
        page: 1,
        totalPages: 2,
        pageSize: 5,
        total: 10, //available products count
        showing: 5 //retrieved products count
      })
    })
  })
}