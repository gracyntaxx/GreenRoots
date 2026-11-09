-- Migration 07: Scheduled Jobs (pg_cron & pg_net)

-- Helper to trigger cron-dispatch edge function
CREATE OR REPLACE FUNCTION trigger_cron_job(p_job_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text;
  v_cron_secret text;
BEGIN
  -- Read from database settings or Vault
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_cron_secret := current_setting('app.settings.cron_secret', true);

  IF v_supabase_url IS NOT NULL AND v_cron_secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/cron-dispatch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_cron_secret,
        'X-Cron-Secret', v_cron_secret
      ),
      body := jsonb_build_object('job', p_job_name)
    );
  END IF;
END;
$$;

-- Setup standard pg_cron schedules
-- (Conditional block so migration succeeds in environments where pg_cron extension schema is available)
DO $main$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- 1. Expire unpaid orders (every 5 min)
    PERFORM cron.schedule(
      'expire_unpaid_orders',
      '*/5 * * * *',
      $cron$SELECT trigger_cron_job('expire_unpaid_orders');$cron$
    );

    -- 2. Pool deadline watch (every 15 min)
    PERFORM cron.schedule(
      'pool_deadline_watch',
      '*/15 * * * *',
      $cron$SELECT trigger_cron_job('pool_deadline_watch');$cron$
    );

    -- 3. Deadline reminders (hourly)
    PERFORM cron.schedule(
      'deadline_reminders',
      '0 * * * *',
      $cron$SELECT trigger_cron_job('deadline_reminders');$cron$
    );

    -- 4. Reconcile payments (every 10 min)
    PERFORM cron.schedule(
      'reconcile_payments',
      '*/10 * * * *',
      $cron$SELECT trigger_cron_job('reconcile_payments');$cron$
    );

    -- 5. Reconcile payouts (every 15 min)
    PERFORM cron.schedule(
      'reconcile_payouts',
      '*/15 * * * *',
      $cron$SELECT trigger_cron_job('reconcile_payouts');$cron$
    );

    -- 6. Notification dispatch (every minute)
    PERFORM cron.schedule(
      'notification_dispatch',
      '* * * * *',
      $cron$SELECT trigger_cron_job('notification_dispatch');$cron$
    );

    -- 7. Forecast refresh (nightly at 2:00 AM)
    PERFORM cron.schedule(
      'forecast_refresh',
      '0 2 * * *',
      $cron$SELECT trigger_cron_job('forecast_refresh');$cron$
    );

    -- 8. Seasonal alerts (weekly on Monday at 6:00 AM)
    PERFORM cron.schedule(
      'seasonal_alerts',
      '0 6 * * 1',
      $cron$SELECT trigger_cron_job('seasonal_alerts');$cron$
    );

    -- 9. Reputation recalculation (nightly at 3:00 AM)
    PERFORM cron.schedule(
      'reputation_recalc',
      '0 3 * * *',
      $cron$SELECT trigger_cron_job('reputation_recalc');$cron$
    );

    -- 10. Moderation rules scan (hourly at minute 30)
    PERFORM cron.schedule(
      'moderation_rules_scan',
      '30 * * * *',
      $cron$SELECT trigger_cron_job('moderation_rules_scan');$cron$
    );

  END IF;
END $main$;

