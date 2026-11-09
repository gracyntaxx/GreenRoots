import type { Forecast } from "@/types";
import { call } from "./http";
import { getState, MockError } from "@/mocks/store";

export const forecastService = {
  list(): Promise<Forecast[]> {
    return call("forecasts/list", undefined, () => getState().forecasts);
  },

  get(id: string): Promise<Forecast> {
    return call(`forecasts/get?id=${encodeURIComponent(id)}`, undefined, () => {
      const f = getState().forecasts.find((x) => x.id === id);
      if (!f) throw new MockError("Forecast not found", "NOT_FOUND");
      return f;
    });
  },

  forSeason(region: string, season: string): Promise<Forecast | undefined> {
    return call(`forecasts/for-season?region=${encodeURIComponent(region)}&season=${encodeURIComponent(season)}`, undefined, () =>
      getState().forecasts.find((f) => f.region === region && f.season === season)
    );
  },
};
