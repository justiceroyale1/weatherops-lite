import { onRequest } from "firebase-functions/v2/https";

export const health = onRequest((_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "weatherops-lite-functions",
  });
});
