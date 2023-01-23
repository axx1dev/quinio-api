//environment variables
const token = process.env.TOKEN;

const https = require('https');
const connection = require("./connect-db")

function getData(pageNumber) {
    const options = {
        hostname: 'sandbox-api.muventa.mx',
        path: '/orders/v1/loyalty/bulk/export/transactions?size=5&page='+pageNumber,
        headers: {
            'X-Escale-Details': token
        }
    }
  
    return new Promise((resolve, reject) => {
      const req = https.get(options, res => {
        let result = '';
  
        res.on('data', chunk => {
            result += chunk;
        });
  
        res.on('end', () => {
          try {
            resolve(JSON.parse(result));
          } catch (err) {
            reject(new Error(err));
          }
        });
      });
  
      req.on('error', err => {
        reject(new Error(err));
      });
    });
}

exports.getAndSaveDataHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }

    let response = {};
    const page = event?.queryStringParameters?.page
    const headers = {
        "Access-Control-Allow-Headers" : "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET"  
    }

    try {
        if (parseInt(page) > 14 || parseInt(page) < 0) {
            return response = {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({message: "you can choose only from 0 to 14 like page param"})
            };
        }

        const result = await getData(page || 0);
        if (result.content.length <= 0) {
            return response = {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({message: 'Not exist data for this request'})
            };
        }
        
        const db = await connection

        const bulkUpdate = result.content.map(function(res) {
            return {
                "updateOne": {
                    "filter": { "id": res.id },
                    "update": { "$set": res },
                    "upsert": true
                }
            };
        });

        await db.collection("purses").bulkWrite(bulkUpdate, function(err) {
            if (err) throw err;
        });

        const count = await db.collection("purses").count()
       
        response = {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({data: 'The registers were updated '+count})
        };
    } catch (ResourceNotFoundException) {
        response = {
            statusCode: 404,
            headers: headers,
            body: "Failed connection"
        };
    }

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
