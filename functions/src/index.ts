import { onRequest } from "firebase-functions/v2/https";

import { handleWeatherRequest } from "./controllers/weather-controller";

export const health = onRequest((_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "weatherops-lite-functions",
  });
});

export const weather = onRequest(handleWeatherRequest);
