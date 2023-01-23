const connection = require("./connect-db")

exports.getDataPurses = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
 
  const page = parseInt(event.pathParameters.page);
  const limit = parseInt(event.pathParameters.limit); 

  const startDate = event.pathParameters?.startDate || null;
  const endDate = event.pathParameters?.endDate || null; 

  let response = {};
  const headers = {
    "Access-Control-Allow-Headers" : "*",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET"  
  }

  try {
    const db = await connection
    const count = await db.collection("purses").find(startDate !== null? {"createdAt": {
      $gt: startDate,
      $lt: endDate
    }} : {}).count()
    //const result = await db.collection("purses").find({createdAt:{$gte:ISODate("2021-09-14"),$lt:ISODate("2021-10-08")}}).skip(page * limit).limit(limit).toArray()
    const result = await db.collection("purses").find(startDate !== null?{"createdAt": {
      $gt: startDate,
      $lt: endDate
    }} : {}).skip(page * limit).limit(limit).toArray()
    const allPages = Math.ceil(count/limit)
   
    response = {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({total: count, pages:allPages, data: result})
    };
  } catch (ResourceNotFoundException) {
    response = {
        statusCode: 404,
        headers: headers,
        body: JSON.stringify({message: "Failed connection"})
    };
  }
 
  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}
