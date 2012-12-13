update ap_current set period = SUBSTRING(period, 2);
update ap_series set begin_period = substring(begin_period, 2), end_period=substring(begin_period, 2);

create table current_temp SELECT
`ap_current`.`series_id`,
`ap_current`.`year`,
`ap_current`.`period`,
`ap_current`.`value`,
`ap_current`.`footnote_codes`
FROM `bls`.`ap_current`
group by `ap_current`.`series_id`,
`ap_current`.`year`,
`ap_current`.`period`,
`ap_current`.`value`,
`ap_current`.`footnote_codes`;

delete from ap_current;

INSERT INTO `ap_current`
(`series_id`,
`year`,
`period`,
`value`,
`footnote_codes`)
select * from current_temp;
drop table current_temp;

ALTER TABLE `ap_series` CHANGE COLUMN `begin_year` `begin_year` YEAR NOT NULL  , CHANGE COLUMN `begin_period` `begin_period` TINYINT NOT NULL  , CHANGE COLUMN `end_year` `end_year` YEAR NOT NULL  , CHANGE COLUMN `end_period` `end_period` TINYINT NOT NULL  ;

ALTER TABLE `ap_current` CHANGE COLUMN `year` `year` year NOT NULL  , CHANGE COLUMN `period` `period` TINYINT NOT NULL  ;

ALTER TABLE `ap_current` 
	ADD PRIMARY KEY (`series_id`, `year`, `period`) 
	, ADD INDEX `series` (`series_id` ASC) 
	, ADD INDEX `month` (`year` ASC) 
	, ADD INDEX `year` (`period` ASC);

ALTER TABLE `ap_series` 
	ADD PRIMARY KEY (`series_id`) 
	, ADD INDEX `item` (`item_code` ASC) 
	, ADD INDEX `area` (`area_code` ASC);

ALTER TABLE `ap_area` 
	ADD PRIMARY KEY (`area_code`);

ALTER TABLE `ap_item` 
	ADD PRIMARY KEY (`item_code`);

drop table  if exists measurements;

create table measurements (
    priority tinyint NOT NULL PRIMARY KEY,
    keyword varchar(63) NOT NULL,
    label varchar(63) NOT NULL
);

INSERT INTO `bls`.`measurements`
VALUES
-- terms
(1, 'gallon', 'gallon'),
(2, 'ounces', 'ounces'),
(3, 'pound', 'pounds'),
(4, 'KWH', 'KWH'),
(5, 'therm', 'therm'),
-- abbreviations
(6, 'gal.', 'gallon'),
(7, 'lb.', 'pounds'),
(8, 'oz', 'ounces'),
(9, 'doz.', 'dozen'),
(10, 'liter', 'liter');

drop table if exists ap_item_measurement;

create table ap_item_measurement (
    item_code char(6) PRIMARY KEY,
    priority tinyint NOT NULL,
    value float NOT NULL
);

insert into ap_item_measurement (item_code, priority, value) 
select item_code, priority, 0 + CASE WHEN amount_str = 'one-half' or amount_str = '1/2' THEN 0.5 WHEN amount_str = 'per' then 1 WHEN LOCATE('(', amount_str) = 1 THEN SUBSTRING(amount_str, 1-length(amount_str)) WHEN STRCMP(amount_str + 0,amount_str) = 0 then amount_str else 1 END as value from (
select ap_item.item_code, substring(ap_item.description from ind-
locate(' ', reverse(substring(ap_item.description, 1, labels.ind-1)))+1 for locate(' ', reverse(substring(ap_item.description, 1, labels.ind-1))) - 1) as amount_str
, labels.priority from ap_item left join (
select * from (
select *, LOCATE(CONCAT(' ',keyword), description) as ind from ap_item, measurements) indicies
where ind > 0
group by item_code
) labels on ap_item.item_code = labels.item_code) amount;

-- select description, LOCATE('gallon', description),LOCATE('gal.', description),LOCATE('lb.', description), LOCATE('liter', description), LOCATE('ounces', description) from ap_item;


GRANT SELECT ON bls.* TO 'bls_user'@'localhost' identified by 'HhI*+5oP:(X~}@-';