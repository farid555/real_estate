import jwt from "jsonwebtoken";

// Middleware to check if the user is authenticated
export const shouldBeLoggedIn = (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: "Token is not valid!" });

    // Only respond after successful token verification
    return res.status(200).json({ message: "You are Authenticated!" });
  });
};

// Middleware to check if the user is authenticated and is an Admin
export const shouldBeAdmin = (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: "Token is not valid!" });

    // Check if the payload contains the `isAdmin` flag
    if (!payload.isAdmin) {
      return res.status(403).json({ message: "You are not an Admin!" });
    }

    // If the user is authenticated and is an admin
    return res.status(200).json({ message: "You are Authenticated as Admin!" });
  });
};
