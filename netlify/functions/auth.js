exports.handler = async function (event, context) {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  // 获取查询参数
  const queryParams = event.queryStringParameters;

  return {
    statusCode: 200,
    body: JSON.stringify({ message: queryParams }),
  };
};
