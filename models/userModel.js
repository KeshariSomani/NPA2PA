const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({

    name:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    otp:{
        type:String,
    },
    products:[
        {
            product_name:{

            },
            product_price:{

            },
            product_id:{

            }
        },
        {
            timestamps:true
        }
    ]
 
},
{
    timestamps:true
}
);

const userModel = mongoose.model('userModel',userSchema);
module.exports = userModel;