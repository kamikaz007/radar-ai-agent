const axios = require('axios');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { paymentId } = JSON.parse(event.body);
    if (!paymentId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'paymentId is required' }) };
    }
    const PI_API_URL = 'https://api.minepi.com/v2/payments/' + paymentId;
    const response = await axios.get(PI_API_URL, {
      headers: {
        'Authorization': 'Key ' + process.env.PI_SERVER_KEY,
        'Content-Type': 'application/json',
      },
    });
    const paymentData = response.data;
    if (paymentData && paymentData.status === 'completed') {
      return { statusCode: 200, body: JSON.stringify({ success: true, payment: paymentData }) };
    } else {
      return { statusCode: 402, body: JSON.stringify({ success: false, message: 'Payment not completed yet' }) };
    }
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error during verification' }) };
  }
};
