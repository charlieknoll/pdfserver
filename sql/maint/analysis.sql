select * from users order by id;
select * from request_log where apikey_id = 15 order by id desc limit 1000;
select * from subscription order by id desc;
select * from subscription_log;
select * from pricing_plan;
select * from users;

select * from request_log 
where apikey_id not in (
	select id from apikey 
	where subscription_id in (
		select id from subscription where user_id in (4,1,7)
	)
) order by id desc limit 100

select * from request_log 
where apikey_id in (
	select id from apikey 
	where subscription_id in (
		select id from subscription where user_id > 10
	)
) order by id desc limit 100