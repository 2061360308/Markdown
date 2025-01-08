const axios = require("axios");

exports.handler = async function (event, context) {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  // 获取查询参数
  const queryParams = event.queryStringParameters;
  const code = queryParams.code;

  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id,
        client_secret,
        code,
        redirect_uri,
      },
      {
        headers: {
          accept: "application/json",
        },
      }
    );

    // console.log(response.data);

    const access_token = response.data.access_token;

    return {
      statusCode: 302,
      headers: {
        Location: "localhost:5173/editor/?code=" + access_token,
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Redirecting back to original page" }),
    };

    // return res.json({ code: code, data: response.data});
  } catch (error) {
    console.error(error);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: error }),
    };
  }
};
