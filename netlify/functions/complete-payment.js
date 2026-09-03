const axios = require('axios');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { paymentId, txid } = JSON.parse(event.body);
    if (!paymentId || !txid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'paymentId and txid are required' }) };
    }

    if (!process.env.PI_SERVER_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'PI_SERVER_KEY is not configured in environment' }) };
    }

    const PI_API_URL = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
    const response = await axios.post(PI_API_URL, { txid }, {
      headers: {
        'Authorization': 'Key ' + process.env.PI_SERVER_KEY,
        'Content-Type': 'application/json',
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: response.data }),
    };
  } catch (error) {
    console.error('Completion error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data?.message || error.message || 'Server error during completion' }),
    };
  }
};
