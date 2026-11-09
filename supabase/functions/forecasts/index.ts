import { handleForecastRequest } from "../forecast/index.ts";

Deno.serve(handleForecastRequest);

