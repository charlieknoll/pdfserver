DROP TABLE IF EXISTS pdflog;
DROP TABLE IF EXISTS pricing_plan;
DROP TABLE IF EXISTS pdf_log;
DROP TABLE IF EXISTS cache_log;
DROP TABLE IF EXISTS charge;


CREATE TABLE "users_temp" (
	"id" bigserial PRIMARY KEY,
	"email" varchar(255) UNIQUE,
  "reset_token" varchar(255),
  "token_expire" timestamp(6),
	"display_name" varchar(255),
	"password_hash" varchar(100),
	"user_type" varchar(50)
);

INSERT INTO users_temp (email, reset_token, token_expire, display_name, password_hash, user_type)
SELECT        email, resettoken, tokenexpire, displayname, passwordhash, usertype
FROM users
Order By Id;

SELECT * INTO apikey_data FROM apikey;

DROP TABLE apikey;
DROP TABLE users;

ALTER TABLE "users_temp" RENAME TO "users";

CREATE TABLE pricing_plan (
  "id" bigserial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "price" money NOT NULL,
  "credits" int not null,
  "rate_limit" int not null,
  "concurrent_limit" int not null,
  "active" boolean not null
);

INSERT INTO pricing_plan (name, price, credits, rate_limit, concurrent_limit, active)
SELECT 'Free', 0.0, 100, 30, 1, true;

INSERT INTO pricing_plan (name, price, credits, rate_limit, concurrent_limit, active)
SELECT 'Developer', 19.95, 1000, 120, 1, true;

INSERT INTO pricing_plan (name, price, credits, rate_limit, concurrent_limit, active)
SELECT 'Startup', 49.95, 10000, 360, 4, true;

INSERT INTO pricing_plan (name, price, credits, rate_limit, concurrent_limit, active)
SELECT 'Business', 129.95, 50000, 1080, 12, true;

CREATE TABLE "subscription" (
  "id" bigserial PRIMARY KEY,
	"user_id" int NOT NULL REFERENCES users(id),
	"pricing_plan_id" int NOT NULL REFERENCES pricing_plan(id),
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
                         pricing_plan AS pp ON pp.id = 1 INNER JOIN
                         apikey_data AS a ON u.id = a.userid;

CREATE TABLE apikey (
	"id" bigserial PRIMARY KEY,
	"subscription_id" int NOT NULL REFERENCES subscription(id),
	"value" varchar(255) NOT NULL,
	"descr" varchar(255),
  "revoked" boolean NOT NULL
);

INSERT INTO apikey(subscription_id, value, revoked)
SELECT        subscription.id, a.value, false
FROM            apikey_data AS a INNER JOIN
                         subscription ON a.userid = subscription.user_id;

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

CREATE TABLE "cache_log" (
	"id" bigserial PRIMARY KEY,
	"apikey_id" int NOT NULL REFERENCES apikey(id),
  "request_type" varchar(20) NOT NULL,
  "request_time" timestamp nOT NULL,
  "cache_key" varchar(300) NOT NULL,
  "expires" int NOT NULL,
  "size" int NOT NULL
);

CREATE TABLE "charge" (
  "id" bigserial PRIMARY KEY,
	"subscription" int NOT NULL REFERENCES subscription(id),
  "amount" money NOT NULL,
  "tx_date" date NOT NULL,
  "tx_id" varchar(255) not null,
  "method" varchar(255) not null
)

--TODO create indexes
DROP INDEX IF EXISTS fk_user_subscription;
CREATE INDEX IF NOT EXISTS fk_user_subscription ON subscription (user_id)
DROP INDEX IF EXISTS apikey_value;
CREATE UNIQUE INDEX apikey_value ON apikey (value) INCLUDE (id, revoked);
--VACUUM ANALYZE apikey;

--TODO create materialized view
DROP VIEW IF EXISTS apikey_validation;
CREATE VIEW apikey_validation AS
SELECT
  apikey.id,
  apikey.value,
  subscription.user_id,
  COALESCE(CURRENT_DATE > subscription.cancel_date, FALSE) cancelled,
  apikey.revoked,
  subscription.used_credits >= subscription.credits overdrawn,
  subscription.rate_limit,
  subscription.concurrent_limit
FROM
  apikey
  INNER JOIN
    subscription
    ON apikey.subscription_id = subscription.id;

