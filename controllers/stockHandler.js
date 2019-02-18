 var mongoose = require('mongoose')
 var request = require('request')
 var apikey = process.env.APLHPAKEY
const CONNECTION_STRING = process.env.DB;
const Schema = mongoose.Schema
const stockSchema = new Schema({
  stock: {type: String, unique: true},
  likes: {type: Number, default: 0},
  ips: [String]
})
const Stock = mongoose.model('stock', stockSchema)
//Calculates relative likes
function likeDiff(stock, anotherStock){
  var diff
  var likes1 = stock.ips.length
  var likes2 = anotherStock.ips.length
if(likes1> likes2){
 diff = likes1-likes2
  return [diff,diff*(-1)]
}else if(likes1 < likes2){
  diff = likes2-likes1
  return [diff*(-1),diff]
}else return [0,0]
}
module.exports = function(app, db){
app.route('/api/stock-prices')
    .get(function (req, res){
      var ip  =  req.headers.host || req.headers["x-forwarded-for"].split(',')[0];
      var query = req.query  
      if(query.like){
        var stock;
        var body;
    if(typeof query.stock == 'string'){
    var reqUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+ query.stock+ "&apikey="+ apikey
    var stockName = query.stock.toUpperCase()
    Stock.findOneAndUpdate({stock: stockName},{stock: stockName, $addToSet:{ips: ip}},{new:true, upsert: true, fields: "-_id -__v"},(err, result)=>{
      if(err) console.log(err)
        else {
          request(reqUrl, function (error, response, body) {
            if(err) console.log("stock price request failed: ", err)
            else {
             var jbody = JSON.parse(body)
             var stockValue = jbody['Global Quote']['05. price']
              res.json({
              stock: result.stock,
              price: Number(stockValue).toFixed(2),
              likes: result.ips.length
              })
            }
         });
        }
      })
     
    } else {
      var answer = []
      var price= []
      for(let i in query.stock){
         let stockName = query.stock[i].toUpperCase()
        Stock.findOneAndUpdate({stock: stockName},{stock: stockName , $addToSet:{ips: ip}},{new:true, upsert: true, fields: "-_id -__v"},(err, result)=>{
        if(err) console.log(err)
        else {
        answer.push(result)
              let reqUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+ query.stock[i]+ "&apikey="+ apikey
       
          request(reqUrl, function (error, response, body) {
            if(err) console.log("stock price request failed: ", err)
            else {
                 let jbody = JSON.parse(body)
              let num  =jbody['Global Quote']['05. price']              
             price.push(num)
              //done with the second request
              if(i == 1){
                var diff = likeDiff(answer[0],answer[1])
                var finalResult = answer.map((item,i)=>{
                  return {
                  stock: item.stock,
                  price: Number(price[i]).toFixed(2),
                  rel_likes: diff[i]
                  }
                })
               
               res.json(finalResult)
              }
             
            }
         });
        }
      })
      }

      
    }}else {
        var stock;
        var body;
    if(typeof query.stock == 'string'){
       var stockName = query.stock.toUpperCase()
    var reqUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+ stockName+ "&apikey="+ apikey
    Stock.findOneAndUpdate({stock: stockName},{stock: stockName},{new:true, upsert: true, fields: "-_id -__v"},(err, result)=>{
      if(err) console.log(err)
        else {
          request(reqUrl, function (error, response, body) {
            if(err) console.log("stock price request failed: ", err)
            else {
         var jbody = JSON.parse(body)
         var num = jbody['Global Quote']['05. price']
              res.json({
              stock: result.stock,
              price: Number(num).toFixed(2),
              likes: result.ips.length
              })
            }
         });
        }
      })
    } else {
      var answer = []
      var price= []
      for(let i in query.stock){
         let stockName = query.stock[i].toUpperCase()
        Stock.findOneAndUpdate({stock: stockName},{stock: stockName},{new:true, upsert: true, fields: "-_id -__v"},(err, result)=>{
        if(err) console.log(err)
        else {
        answer.push(result)
              let reqUrl = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+ stockName+ "&apikey="+ apikey
       // var result = result
          request(reqUrl, (error, response, body)=>{
            if(err) console.log("stock price request failed: ", err)
            else {
                 let jbody = JSON.parse(body)
              let num  =jbody['Global Quote']['05. price']
              
             price.push(num)
              //done with the second request
              if(i == 1){
                var diff = likeDiff(answer[0],answer[1])
                var finalResult = answer.map((item,i)=>{
                  return {
                  stock: item.stock,
                  price: Number(price[i]).toFixed(2),
                  rel_likes: diff[i]
                  }
                })
               res.json(finalResult)
              }
             
            }
         });
        }
      })
      }

      
    }
      }
    });

}