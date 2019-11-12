--TODO Add last_charged_date, status, other braintree fields as necessary
--TODO Add subscription.discount_amount
--Add sign up date to user registration
--TODO add payment_method table


-- ALTER TABLE subscription
-- ADD COLUMN IF NOT EXISTS gateway_id varchar(36);

ALTER TABLE subscription
ADD COLUMN IF NOT EXISTS payment_method_descr varchar(100);

ALTER TABLE subscription
ADD COLUMN IF NOT EXISTS expiration varchar(100);

ALTER TABLE subscription
ADD COLUMN IF NOT EXISTS status varchar(20); --cancelled, active, past due, expired

CREATE TABLE "subscription_log" (
	"id" bigserial PRIMARY KEY,
	"subscription_id" bigint NOT NULL REFERENCES subscription(id),
  "kind" varchar(255) NOT NULL,
  "event_timestamp" timestamp NOT NULL
);

DROP INDEX IF EXISTS fk_subscription_log_subscription;
CREATE INDEX IF NOT EXISTS fk_subscription_log_subscription ON subscription_log (subscription_id);

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
  subscription.pricing_plan_id = 1 as include_console
FROM
  apikey
  INNER JOIN
    subscription
    ON apikey.subscription_id = subscription.id
WHERE subscription.cancel_date IS NULL AND
  apikey.revoked = false;

-- DROP TABLE IF EXISTS payment_method;

-- --"https://assets.braintreegateway.com/payment_method_logo/visa.png?environment=sandbox"
-- CREATE TABLE "payment_method" (
-- 	"id" serial PRIMARY KEY,
-- 	"user_id" bigint NOT NULL REFERENCES users(id),
-- --INSERT payment_method(payment_type, bin, token, expire, last4, payload)

--   account_type varchar(30) NOT NULL, -- "PayPalAccount", "CreditCard"
--   account_id varchar(200) NULL, --charlie.knoll@gmail.com
--   expiration_month varchar(2) NULL,
--   expiration_year varchar(4) NULL,
--   bin varchar(8) null,
--   card_type varchar(20) null,
--   last_four varchar(4) null,
--   token varchar(36) not null,
--   info jsonb not null
-- );
-- DROP INDEX IF EXISTS fk_payment_method_users;
-- CREATE INDEX IF NOT EXISTS fk_payment_method_users ON payment_method (user_id);

--Add gateway_customer: bool to the user table to be used in determine if should use gateway.customer.create or gateway.paymentMethod.create