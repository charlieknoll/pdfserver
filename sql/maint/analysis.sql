select * from users order by id;
select * from request_log where apikey_id = 15 order by id desc limit 1000;
select * from subscription order by id desc;
select * from subscription_log;
select * from pricing_plan;
select * from users order by id desc;

--Info about apikey
SELECT        users.email, users.display_name, request_log.request_time, subscription.start_date as subscription_start_date, subscription.used_credits, pricing_plan.name AS pricing_plan_name
FROM            users INNER JOIN
                         subscription ON users.id = subscription.user_id INNER JOIN
                         pricing_plan ON subscription.pricing_plan_id = pricing_plan.id INNER JOIN
                         apikey ON subscription.id = apikey.subscription_id INNER JOIN
                         request_log ON apikey.id = request_log.apikey_id
WHERE 						 
 apikey.id = 4
ORDER BY request_log.id desc

--Latest requests
select * from request_log 
where apikey_id not in (
	select id from apikey 
	where subscription_id in (
		select id from subscription where user_id not in (4,1,7)
	)
)
and apikey_id not in (16,13,4) --not admin or uptimerobot or bikeparts
order by id desc limit 100




select * from request_log 
where apikey_id in (
	select id from apikey 
	where subscription_id in (
		select id from subscription where user_id > 10 and user_id <> 48
	)
) order by id desc limit 100

select * from apikey 
where id = 62

select * from subscription where id = 57

select * from users where id = 48