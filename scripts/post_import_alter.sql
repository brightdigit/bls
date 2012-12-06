update ap_current set period = SUBSTRING(period, 2);
ALTER TABLE `bls`.`ap_current` CHANGE COLUMN `year` `year` year NOT NULL  , CHANGE COLUMN `period` `period` TINYINT NOT NULL  ;
update ap_series set begin_period = substring(begin_period, 2), end_period=substring(begin_period, 2);
ALTER TABLE `bls`.`ap_series` CHANGE COLUMN `begin_year` `begin_year` YEAR NOT NULL  , CHANGE COLUMN `begin_period` `begin_period` TINYINT NOT NULL  , CHANGE COLUMN `end_year` `end_year` YEAR NOT NULL  , CHANGE COLUMN `end_period` `end_period` TINYINT NOT NULL  ;

ALTER TABLE `bls`.`ap_current` 
	ADD PRIMARY KEY (`series_id`, `year`, `period`) 
	, ADD INDEX `series` (`series_id` ASC) 
	, ADD INDEX `month` (`year` ASC) 
	, ADD INDEX `year` (`period` ASC);

ALTER TABLE `bls`.`ap_series` 
	ADD PRIMARY KEY (`series_id`) 
	, ADD INDEX `item` (`item_code` ASC) 
	, ADD INDEX `area` (`area_code` ASC);

ALTER TABLE `bls`.`ap_area` 
	ADD PRIMARY KEY (`area_code`);

ALTER TABLE `bls`.`ap_item` 
	ADD PRIMARY KEY (`item_code`);
