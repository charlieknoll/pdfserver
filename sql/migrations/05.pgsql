--TODO Add last_charged_date, status, other braintree fields as necessary
--TODO Add subscription.discount_amount
--Add sign up date to user registration
--TODO add payment_method table


ALTER TABLE users
ADD COLUMN IF NOT EXISTS vault_id varchar(36);

DROP TABLE IF EXISTS payment_method;

--"https://assets.braintreegateway.com/payment_method_logo/visa.png?environment=sandbox"
CREATE TABLE "payment_method" (
	"id" serial PRIMARY KEY,
	"user_id" bigint NOT NULL REFERENCES users(id),
--INSERT payment_method(payment_type, bin, token, expire, last4, payload)

  account_type varchar(30) NOT NULL, -- "PayPalAccount", "CreditCard"
  account_id varchar(200) NULL, --charlie.knoll@gmail.com
  expiration_month varchar(2) NULL,
  expiration_year varchar(4) NULL,
  bin varchar(8) null,
  card_type varchar(20) null,
  last_four varchar(4) null,
  token varchar(36) not null,
  info jsonb not null
);
DROP INDEX IF EXISTS fk_payment_method_users;
CREATE INDEX IF NOT EXISTS fk_payment_method_users ON payment_method (user_id);

--Add gateway_customer: bool to the user table to be used in determine if should use gateway.customer.create or gateway.paymentMethod.create