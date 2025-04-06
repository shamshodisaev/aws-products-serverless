type eventType = {
  type: string;
  methodArn: string;
  authorizationToken: string;
};

const PASSWORD = "TEST_PASSWORD";

exports.handler = async (event: eventType) => {
  try {
    const [, token] = event.authorizationToken.split(" ");
    const decodedToken = atob(token);
    const isValidPassword = decodedToken.includes(PASSWORD);

    if (isValidPassword) {
      return generatePolicy("user", "Allow", event.methodArn);
    } else {
      throw new Error("Invalid token");
    }
  } catch (err) {
    throw new Error("Unauthorized");
  }
};

const generatePolicy = function (
  principalId: string,
  effect: string,
  resource: string
) {
  const authResponse: any = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    };

    authResponse.policyDocument = policyDocument;
  }

  // Optional output with custom properties of the String, Number or Boolean type.
  authResponse.context = {
    stringKey: "stringval",
    numberKey: 123,
    booleanKey: true,
  };
  return authResponse;
};
