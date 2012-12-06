drop table if exists meta;
drop table if exists import;

CREATE TABLE `meta` (
  `table_name` varchar(255) NOT NULL,
  `position` tinyint(4) NOT NULL,
  `column_name` varchar(255) NOT NULL,
  `column_type` varchar(255) NOT NULL,
  `nullable` tinyint(1) NOT NULL
);

CREATE TABLE `import` (
  `file_name` varchar(255) NOT NULL,
  `table_name` varchar(255) NOT NULL,
  PRIMARY KEY (`file_name`)
);

delete from meta;
insert into meta values ('ap_current', 0, 'series_id', 'char(13)', false);
insert into meta values ('ap_current', 1, 'year', 'char(4)', false);
insert into meta values ('ap_current', 2, 'period', 'char(3)', false);
insert into meta values ('ap_current', 3, 'value', 'decimal', false);
insert into meta values ('ap_current', 4, 'footnote_codes', 'char(45)', true);
insert into meta values ('ap_series', 0, 'series_id', 'char(13)', false);
insert into meta values ('ap_series', 1, 'area_code', 'char(4)', false);
insert into meta values ('ap_series', 2, 'item_code', 'char(6)', false);
insert into meta values ('ap_series', 3, 'footnote_codes', 'char(45)', true);
insert into meta values ('ap_series', 4, 'begin_year', 'char(4)', false);
insert into meta values ('ap_series', 5, 'begin_period', 'char(3)', false);
insert into meta values ('ap_series', 6, 'end_year', 'char(4)', false);
insert into meta values ('ap_series', 7, 'end_period', 'char(3)', false);
insert into meta values ('ap_item', 0, 'item_code', 'char(6)', false);
insert into meta values ('ap_item', 1, 'description', 'varchar(255)', false);
insert into meta values ('ap_area', 0, 'area_code', 'char(4)', false);
insert into meta values ('ap_area', 1, 'area_name', 'varchar(255)', false);
delete from import;

insert into import values('ap/ap.data.1.HouseholdFuels','ap_current');
insert into import values('ap/ap.data.2.Gasoline','ap_current');
insert into import values('ap/ap.data.3.Food','ap_current');
insert into import values('ap/ap.item','ap_item');
insert into import values('ap/ap.series','ap_series');
insert into import values('ap/ap.area','ap_area');