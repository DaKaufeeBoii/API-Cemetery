function response(statusCode: number, body: any) {
  return { statusCode, body: JSON.stringify(body) };
}

exports.handler = async (event: any) => {
  return response(200, [{ id: "proj-demo-001", name: "Acme SaaS Platform" }]);
};
