DROP VIEW IF EXISTS apikey_validation;

CREATE VIEW apikey_validation AS
SELECT
  apikey.id as apikey_id,
  subscription.id as subscription_id,
  apikey.value as apikey,
  subscription.user_id,
  subscription.used_credits >= subscription.credits overdrawn,
  subscription.rate_limit,
  subscription.concurrent_limit,
  subscription.pricing_plan_id = 1 and subscription.user_id <> 1 as include_console
FROM
  apikey
  INNER JOIN
    subscription
    ON apikey.subscription_id = subscription.id
WHERE subscription.cancel_date IS NULL AND
  apikey.revoked = false;



GRANT USAGE ON SCHEMA public TO rp_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rp_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rp_user;
