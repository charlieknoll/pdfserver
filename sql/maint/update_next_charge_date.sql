--Run nightly after midnight, or on webhook from braintree

--Apply to those where last_charged_date is < Current_date or null and next_charge_date < Current_date test

select datediff('month','2018-01-31'::date, '2019-11-01'::date)