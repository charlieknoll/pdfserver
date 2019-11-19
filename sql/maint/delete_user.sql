DO $$ 
DECLARE
	_user_id integer := 17;
BEGIN
delete from cache_log where request_log_id in (select id from request_log where apikey_id in (select id from apikey where subscription_id in (select id from subscription where user_id = _user_id)));
delete from request_log where apikey_id in (select id from apikey where subscription_id in (select id from subscription where user_id = _user_id));
delete from apikey where subscription_id in (select id from subscription where user_id = _user_id);
delete from subscription_log where subscription_id in (select id from subscription where user_id = _user_id);
delete from subscription where user_id = _user_id;
delete from users where id = _user_id;
END $$;
--select * from subscription where user_id = 79;

select * from users;
select * from apikey;
--select * from subscription;