const { jwtDecode } = require("jwt-decode");

const extractToken = function (authHeader) {
  try {
    let encodedToken = authHeader.replace("Bearer ", "");

    let payload = jwtDecode(encodedToken);

    return payload;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = { extractToken };
