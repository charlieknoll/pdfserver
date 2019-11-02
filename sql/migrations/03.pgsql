--TODO create materialized view
DROP VIEW IF EXISTS apikey_validation;

SELECT * INTO apikey_data FROM apikey;

DROP TABLE IF EXISTS cache_log;
DROP TABLE IF EXISTS request_log;
DROP TABLE IF EXISTS charge;
DROP TABLE IF EXISTS apikey;
DROP TABLE IF EXISTS subscription;


CREATE TABLE "subscription" (
  "id" bigserial PRIMARY KEY,
	"user_id" bigint NOT NULL REFERENCES users(id),
	"pricing_plan_id" bigint NOT NULL REFERENCES pricing_plan(id),
  "discount_code" varchar(20),
  "start_date" date NOT NULL,
  "cancel_date" date NULL,
  "next_charge_date" date NULL,
	"used_credits" int NOT NULL,
  "credits" int not null,
  "rate_limit" int not null,
  "concurrent_limit" int not null
);


INSERT INTO subscription (  user_id, pricing_plan_id, start_date, used_credits, credits, rate_limit, concurrent_limit)
SELECT        u.id, pp.id AS ppid, '10-01-2019',0,pp.credits,pp.rate_limit,pp.concurrent_limit
FROM            users AS u INNER JOIN
                         pricing_plan AS pp ON pp.id = 1 order by u.id;

CREATE TABLE apikey (
	"id" bigserial PRIMARY KEY,
	"subscription_id" bigint NOT NULL REFERENCES subscription(id),
	"value" varchar(255) NOT NULL,
	"descr" varchar(255),
  "revoked" boolean NOT NULL
);


INSERT INTO apikey(subscription_id, value, revoked)
SELECT 1, value, revoked FROM apikey_data ORDER BY subscription_id;

UPDATE apikey set subscription_id = "id";

DROP TABLE apikey_data;


DROP INDEX IF EXISTS fk_apikey_subscription;
CREATE INDEX IF NOT EXISTS fk_apikey_subscription ON apikey (subscription_id);
--FIX naming convention
DROP INDEX IF EXISTS fk_user_subscription;
DROP INDEX IF EXISTS fk_subscription_user;
CREATE INDEX IF NOT EXISTS fk_subscription_user ON subscription (user_id);
--FIX remove id from covering index
DROP INDEX IF EXISTS apikey_value;
CREATE UNIQUE INDEX apikey_value ON apikey (value) INCLUDE (revoked);

CREATE VIEW apikey_validation AS
SELECT
  apikey.id as apikey_id,
  subscription.id as subscription_id,
  apikey.value as apikey,
  subscription.user_id,
  subscription.used_credits >= subscription.credits overdrawn,
  subscription.rate_limit,
  subscription.concurrent_limit,
  subscription.pricing_plan_id = 1 as include_console
FROM
  apikey
  INNER JOIN
    subscription
    ON apikey.subscription_id = subscription.id
WHERE COALESCE(CURRENT_DATE > subscription.cancel_date, FALSE) = false AND
  apikey.revoked = false;





CREATE TABLE "request_log" (
	"id" bigserial PRIMARY KEY,
	"apikey_id" bigint NOT NULL REFERENCES apikey(id),
  "value" varchar(255) NULL,
  "ip_address" varchar(46) NOT NULL,
	"delay" int NOT NULL,
	"duration" int NOT NULL,
  "status" int NOT NULL,
	"request_time" timestamp NOT NULL,
  "network_data" bigint NOT NULL,
  "cached_data" bigint NOT NULL,
  "from_cache_data" bigint NOT NULL,
  "file_size" bigint NOT NULL
);
DROP INDEX IF EXISTS fk_request_log_apikey;
CREATE INDEX IF NOT EXISTS fk_request_log_apikey ON request_log (apikey_id);



CREATE TABLE "cache_log" (
	"id" bigserial PRIMARY KEY,
	"request_log_id" bigint NOT NULL REFERENCES request_log(id),
  "request_type" varchar(20) NOT NULL,
  "cache_key" varchar(300) NOT NULL,
  "expires" bigint NOT NULL,
  "size" bigint NOT NULL
);
DROP INDEX IF EXISTS fk_cache_log_request_log;
CREATE INDEX IF NOT EXISTS fk_cache_log_request_log ON cache_log (request_log_id);


CREATE TABLE "charge" (
  "id" serial PRIMARY KEY,
	"subscription_id" bigint NOT NULL REFERENCES subscription(id),
  "amount" money NOT NULL,
  "tx_date" date NOT NULL,
  "tx_id" varchar(255) not null,
  "method" varchar(255) not null
);
DROP INDEX IF EXISTS fk_charge_subscription;
CREATE INDEX IF NOT EXISTS fk_charge_subscription ON charge (subscription_id);



GRANT USAGE ON SCHEMA public TO rp_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rp_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rp_user;