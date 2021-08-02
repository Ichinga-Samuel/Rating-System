const mongoose = require('mongoose');

const connectDB = async () => {
     try{
         const conn = await mongoose.connect('mongodb://localhost:27017/myapp', {useNewUrlParser: true, useFindAndModify: false})
         console.log(`MongoDb connected: ${conn.connection.host}`)
         return conn
     }
     catch (e) {
         console.error(e);
         process.exit(1);

     }
 };

connectDB()

// create a schema for our project
const ProductSchema = new mongoose.Schema({
    name: String,
    ratings:{
        type: mongoose.Mixed, // A mixed type object to handle ratings. Each star level is represented in the ratings object
        1: Number,           //  the key is the weight of that star level
        2: Number,
        3: Number,
        4: Number,
        5: Number,
        get: function(r){
            // r is the entire ratings object
            let items = Object.entries(r); // get an array of key/value pairs of the object like this [[1:1], [2:1]...]
            let sum = 0; // sum of weighted ratings
            let total = 0; // total number of ratings
            for(let [key,value] of items){
                total += value;
                sum += value * parseInt(key); // multiply the total number of ratings by it's weight in this case which is the key
            }
            return Math.round(sum / total)
        },
        set: function(r){
            if (!(this instanceof mongoose.Document)){
                // only call setter when updating the whole path with an object
                if(r instanceof Object) return r
                else{throw new Error('')}
            }else{
                // get the actual ratings object without using the getter which returns  an integer value
                // r is the ratings which is an integer value that represent the star level from 1 to 5
                if(r instanceof Object){
                    return r    // handle setting default when creating object
                }
                this.get('ratings', null, {getters: false})[r] = 1 + parseInt(this.get('ratings', null, {getters: false})[r])
                return this.get('ratings', null, {getters: false})} // return the updated ratings object
        },
        validate:{
            validator: function(i){
                let b = [1, 2, 3, 4, 5] // valid star levels
                let v = Object.keys(i).sort()
                return b.every((x, j) => (v.length === b.length) && x === parseInt(v[j]))
            },
            message: "Invalid Star Level"
        },
        default: {1:1, 2:1, 3:1, 4:1, 5:1}
    }
}, {toObject:{getters: true, }, toJSON:{getters: true}})

// create a product model
const product =  mongoose.model('Product', ProductSchema)

const create = async () => {
    let prod = await product.create({name: "Product One"})
    // display the newly created object with and without getters
    console.log(prod)
    console.log(prod.get( 'ratings', null, {getters: false}))
}

const test = async () => {
    // replace the entire rating object
    // this should run successfully
    let prod = await product.findById('61084b72b346c52e8482ed3b')
    prod.ratings = { '1': 1, '2': 1, '3': 1, '4': 30, '5': 1 }
    prod.markModified('ratings')  // Add markModified because ratings is a mixed object type
    prod.save()
    console.log(prod.get( 'ratings', null, {getters: false}))
    console.log(prod)
}

const test1 = async () => {
    // increment a particular star level.
    // by assigning directly to the ratings object
    let prod = await product.findById('61084b72b346c52e8482ed3b')
    prod.ratings = 5
    prod.markModified('ratings')  // Add markModified because ratings is a mixed object type
    prod.save()
    console.log(prod.get( 'ratings', null, {getters: false}))
    console.log(prod)
}

const test2 = async (r) => {
    // increment a particular star level.
    // this should run successfully
    let key = `ratings.${r}`
    let prod = await product.findByIdAndUpdate('61084b72b346c52e8482ed3b', {$inc: {[key]: 1}}, {new: true})
    console.log(prod.get( 'ratings', null, {getters: false}))
    console.log(prod)
}

const test3 = async () => {
    // replace the entire rating object
    // this should run successfully
    let prod = await product.findByIdAndUpdate('61084b72b346c52e8482ed3b', {ratings: {1:3, 2:1, 3:1, 4:1, 5:1}}, {new: true})
    console.log(prod.get( 'ratings', null, {getters: false}))
    console.log(prod)
}

const test4 = async () => {
    // replace the entire rating object
    // the new object has an extra star level
    // this will fail
    let prod = await product.findById('61084b72b346c52e8482ed3b')
    prod.ratings = {'1': 1, '2': 1, '3': 1, '4': 30, '5': 1, 9: 5}
    // prod.ratings = 9 this too will fail
    prod.markModified('ratings')  // Add markModified because ratings is a mixed object type
    prod.save()
    console.log(prod.get('ratings', null, {getters: false}))
}


