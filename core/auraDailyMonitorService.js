import { getAuraDailyKpis, buildForecastV2 } from "./db.js";
import { detectForecastDropTrigger } from "./auraForecastTriggerService.js";

export async function runAuraDailyMonitor({ tenant }) {

  const history = getAuraDailyKpis({
    tenant,
    days: 60
  });

  if (!history.length) {
    return { status: "no_data" };
  }

  const forecast = buildForecastV2(history, 7);

  const trigger = detectForecastDropTrigger({
    history,
    adjustedForecast: forecast.adjustedForecast,
    confidence: forecast.confidence
  });

  if (!trigger?.detected) {
    return {
      status: "healthy",
      confidence: forecast.confidence
    };
  }

  return {
    status: "action_required",
    trigger,
    forecast
  };
}