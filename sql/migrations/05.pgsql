--TODO Add last_charged_date, status, other braintree fields as necessary
--TODO Add subscription.discount_amount
--Add sign up date to user registration
--TODO add payment_method table

CREATE TABLE payment_method

--Add gateway_customer: bool to the user table to be used in determine if should use gateway.customer.create or gateway.paymentMethod.create