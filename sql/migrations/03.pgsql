--TODO create materialized view
DROP VIEW IF EXISTS apikey_validation;
CREATE VIEW apikey_validation AS
SELECT
  apikey.id as apikey_id,
  subscription.id as subscription_id,
  apikey.value as apikey,
  subscription.user_id,
  subscription.used_credits >= subscription.credits overdrawn,
  subscription.rate_limit,
  subscription.concurrent_limit
FROM
  apikey
  INNER JOIN
    subscription
    ON apikey.subscription_id = subscription.id
WHERE COALESCE(CURRENT_DATE > subscription.cancel_date, FALSE) = false AND
  apikey.revoked = false;

DROP INDEX IF EXISTS fk_apikey_subscription;
CREATE INDEX IF NOT EXISTS fk_apikey_subscription ON apikey (subscription_id);
--FIX naming convention
DROP INDEX IF EXISTS fk_user_subscription;
DROP INDEX IF EXISTS fk_subscription_user;
CREATE INDEX IF NOT EXISTS fk_subscription_user ON subscription (user_id);
--FIX remove id from covering index
DROP INDEX IF EXISTS apikey_value;
CREATE UNIQUE INDEX apikey_value ON apikey (value) INCLUDE (revoked);

DROP TABLE IF EXISTS request_log;

CREATE TABLE "request_log" (
	"id" bigserial PRIMARY KEY,
	"apikey_id" int NOT NULL REFERENCES apikey(id),
  "response_type" varchar(5) NOT NULL,
  "url" varchar(255) NOT NULL,
  "ipaddress" varchar(15) NOT NULL,
	"delay" int NOT NULL,
	"duration" int NOT NULL,
  "status" int NOT NULL,
	"request_time" timestamp NOT NULL,
  "network_data" int NOT NULL,
  "stored_data" int NOT NULL,
  "cached_data" int NOT NULL,
  "filesize" int NOT NULL
);

DROP TABLE IF EXISTS cache_log;

CREATE TABLE "cache_log" (
	"id" bigserial PRIMARY KEY,
	"request_log_id" int NOT NULL REFERENCES request_log(id),
  "request_type" varchar(20) NOT NULL,
  "request_time" timestamp nOT NULL,
  "cache_key" varchar(300) NOT NULL,
  "expires" int NOT NULL,
  "size" int NOT NULL
);


GRANT USAGE ON SCHEMA public TO rp_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rp_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rp_user;