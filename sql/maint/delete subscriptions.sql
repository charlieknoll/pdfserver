delete from cache_log where request_log_id in (select id from request_log where apikey_id in (select id from apikey where subscription_id in (select id from subscription where pricing_plan_id <> 1)));
delete from request_log where apikey_id in (select id from apikey where subscription_id in (select id from subscription where pricing_plan_id <> 1));
delete from apikey where subscription_id in (select id from subscription where pricing_plan_id <> 1);
delete from subscription_log where subscription_id in (select id from subscription where pricing_plan_id <> 1);
delete from subscription where pricing_plan_id <> 1;