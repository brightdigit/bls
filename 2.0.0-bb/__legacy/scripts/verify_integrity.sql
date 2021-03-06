select count(*) as count from (select item_code, max(length(description)), count(*) from ap_item group by item_code having count(*) > 1 or max(length(description)) = 255) item_names;
select count(*) as count from (select area_code, max(length(area_name)), count(*) from ap_area group by area_code having count(*) > 1 or max(length(area_name)) = 255) area_names;
select count(*) as count from (select series_id, count(*) from ap_series group by series_id having count(*) > 1) serieses;
select count(*) as count from ap_current 
left join ap_series on ap_current.series_id = ap_series.series_id
left join ap_item on ap_series.item_code = ap_item.item_code
left join ap_area on ap_series.area_code = ap_area.area_code
where ap_area.area_code is null or ap_item.item_code is null or ap_series.series_id is null;