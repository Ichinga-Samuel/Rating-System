const mongoose = require('mongoose')
const {ratings} = require('stars-schema')


const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number
}, {toObject: {getters: true}})

function median(ratings){
    let stars = []
    for(let star in ratings){
        let _ = Array(ratings[star]).fill(star)
        stars.push(..._)
        stars.sort()
    }
    let mid = Math.round(stars.length / 2)
    return stars[mid]
}


ProductSchema.plugin(ratings, {levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], getter:median, name: 'stars'})
const Product = mongoose.model('Product', ProductSchema)

const create = async () => {
    await Product.create({name: 'Product One', price: 5})
}

const find = async () => {
    return await Product.findOne({name: 'Product One'})
}

const update = async (star, count) => {
    return await Product.findOneAndUpdate({name: 'Product One'}, {$inc: {[`stars.${star}`]: count}}, {new: true});
}


const reset = async () => {
    return await Product.findOneAndUpdate({name: 'Product One'}, {stars: {1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1}}, {new: true});
}

const remove = async () => {
    await Product.findOneAndDelete({name: "Product One"})
}

const connectDB = async () => {
    try{
        const conn = await mongoose.connect('mongodb://localhost:27017/products', {useNewUrlParser: true, useFindAndModify: false})
        console.log(`MongoDb connected: ${conn.connection.host}`)
        return conn
    }
    catch (e) {
        console.error(e);
        process.exit(1);

    }
};


async function test(){
    await connectDB()
    await create()

    let prod = await find()
    console.log(prod.stars) // with getters by default the rating will be 5
    console.log(prod.get('stars', null, {getters: false})) // without getters {1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1}

    prod.stars = 3  // Give the product a three-star ratings. Increases the count of three stars.
    prod = await prod.save() // no need to mark as modified.
    console.log(prod.get('stars', null, {getters: false})) // number of three-star ratings has increased to 2 {1:1, 2:1, 3:2, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1}
    console.log(prod.stars) // with getters the average ratings will still be 5 using our median function.

    prod = await update(1, 5) // using increment operators with find and update to increase the number of one-star ratings.
    console.log(prod.get('stars', null, {getters: false})) // {1:6, 2:1, 3:2, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1} The number of three-star ratings will now be 6
    console.log(prod.stars)  // With getter our average ratings will be 3

    prod = await reset() // reset the whole ratings by updating it with an object
    console.log(prod.get('stars', null, {getters: false})) // returns the default object. {1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1}
    await remove()
}

test()
