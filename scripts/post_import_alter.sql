update ap_current set period = SUBSTRING(period, 2);
update ap_series set begin_period = substring(begin_period, 2), end_period=substring(end_period, 2);

create table current_temp SELECT ap_current.series_id,
    ap_current.year,
    ap_current.period,
    ap_current.value,
    ap_current.footnote_codes FROM
    bls.ap_current
group by ap_current.series_id , ap_current.year , ap_current.period , ap_current.value , ap_current.footnote_codes;

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

drop table  if exists units;

create table units (
    unit_id tinyint primary key not null,
    label varchar(63) not null unique
);

insert into units values 
(1, 'KWH'),
(2, 'dozen'),
(3, 'gallon'),
(4, 'liter'),
(5, 'ounces'),
(6, 'pounds'),
(7, 'therm'),
(8, 'teaspoon'),
(9, 'tablespoon'),
(10, 'fluid ounce'),
(11, 'cup'),
(12, 'pint'),
(13, 'quart'),
(15, 'milliliter');

drop table  if exists units_search;

create table units_search (
    priority tinyint NOT NULL PRIMARY KEY,
    keyword varchar(63) NOT NULL,
    unit_id tinyint NOT NULL
);

INSERT INTO units_search
VALUES
-- terms
(1, 'gallon', 3),
(2, 'ounces', 5),
(3, 'pound', 6),
(4, 'KWH', 1),
(5, 'therm', 7),
-- abbreviations
(6, 'gal.', 3),
(7, 'lb.', 6),
(8, 'oz', 5),
(9, 'doz.', 2),
(10, 'liter', 14);

drop table if exists units_ratios;

create table units_ratios (
    ratio_id smallint primary key auto_increment,
    from_unit_id tinyint not null,
    to_unit_id tinyint,
    ratio float not null
);

insert into units_ratios (to_unit_id, from_unit_id, ratio) values
(11,3,16),
(10,3,128),
(4,3,3.78541),
(15,3,3785.41),
(12,3,8),
(13,3,4),
(9,3,256),
(8,3,768),
(11,4,4.226754829727823),
(10,4,33.814038637822584),
(3,4,0.264172176857989),
(15,4,999.9999999999998),
(12,4,2.113377414863912),
(13,4,1.056688707431956),
(9,4,67.62807727564517),
(8,4,202.88423182693552),
(6,5,0.0625),
(5,6,16),
(11,8,0.0208333328),
(10,8,0.1666666624),
(3,8,0.001302083333333),
(4,8,0.004928919144653),
(15,8,4.928919144652999),
(12,8,0.0104166664),
(13,8,0.0052083332),
(9,8,0.3333333248),
(11,9,0.0625),
(10,9,0.5),
(3,9,0.0147867578125),
(4,9,0.0147867578125),
(15,9,14.786757812499998),
(12,9,0.03125),
(13,9,0.015625),
(8,9,3),
(11,10,0.125),
(3,10,0.0078125),
(4,10,0.029573515625),
(15,10,29.573515624999995),
(12,10,0.0625),
(13,10,0.03125),
(9,10,2),
(8,10,6),
(10,11,8),
(3,11,0.0625),
(4,11,0.236588125),
(15,11,236.58812499999996),
(12,11,0.5),
(13,11,0.25),
(9,11,16),
(8,11,48),
(11,12,2),
(10,12,16),
(3,12,0.125),
(4,12,0.47317625),
(15,12,473.1762499999999),
(13,12,0.5),
(9,12,32),
(8,12,96),
(11,13,4),
(10,13,32),
(3,13,0.25),
(4,13,0.9463525),
(15,13,946.3524999999998),
(12,13,2),
(9,13,64),
(8,13,192),
(11,15,0.004226754829728),
(10,15,0.033814038637823),
(3,15,0.000264172176858),
(4,15,0.001),
(12,15,0.002113377414864),
(13,15,0.001056688707432),
(9,15,0.067628077275645),
(8,15,0.202884231826936),
(null, 2, 12);

drop table if exists ap_item_unit;

create table ap_item_unit (
    item_code char(6) PRIMARY KEY,
    unit_id tinyint NOT NULL,
    value float NOT NULL
);

insert into ap_item_unit values ('713111', 10, 16);

drop table if exists ap_item_matches;
create table ap_item_matches as (select item_code from
    ap_item);

delete from ap_item_matches where item_code = '712112';

drop table if exists ap_item_matches_mapping;
create table ap_item_matches_mapping as (select item_code as root_code, item_code from
    ap_item_matches);

insert into ap_item_matches_mapping values ('712111','712112');

drop table if exists ap_item_inactive;
create table ap_item_inactive (
    item_code char(6) NOT NULL PRIMARY KEY
);

insert into ap_item_inactive values
('702112'),
('702611'),
('703211'),
('703411'),
('703421'),
('703422'),
('703423'),
('703425'),
('703431'),
('703611'),
('704321'),
('704412'),
('704413'),
('704421'),
('705111'),
('705141'),
('706211'),
('707111'),
('709211'),
('710122'),
('712403'),
('712404'),
('712405'),
('712407'),
('712408'),
('712409'),
('712410'),
('712411'),
('714111'),
('714231'),
('715111'),
('716121'),
('717111'),
('717113'),
('717114'),
('717312'),
('717324'),
('717327'),
('717411'),
('717413'),
('718631'),
('74712'),
('74713'),
('715212');


drop table if exists ap_item_groups;

create table ap_item_groups (
    group_name varchar(127) primary key
);

insert into ap_item_groups values
('grains'),
('snacks'),
('meat'),
('dairy'),
('fruits and vegetables'),
('condiments'),
('drinks'),
('energy');

drop table if exists ap_item_grouping;

create table ap_item_grouping (
    item_code char(6) PRIMARY KEY,
    group_name varchar(127) NOT null
);

INSERT into ap_item_grouping values ('701111', 'grains');
INSERT into ap_item_grouping values ('701311', 'grains');
INSERT into ap_item_grouping values ('701312', 'grains');
INSERT into ap_item_grouping values ('701321', 'grains');
INSERT into ap_item_grouping values ('701322', 'grains');
INSERT into ap_item_grouping values ('702111', 'grains');
INSERT into ap_item_grouping values ('702211', 'grains');
INSERT into ap_item_grouping values ('702212', 'grains');
INSERT into ap_item_grouping values ('702213', 'grains');
INSERT into ap_item_grouping values ('702221', 'grains');
INSERT into ap_item_grouping values ('702411', 'snacks');
INSERT into ap_item_grouping values ('702421', 'snacks');
INSERT into ap_item_grouping values ('703111', 'meat');
INSERT into ap_item_grouping values ('703112', 'meat');
INSERT into ap_item_grouping values ('703113', 'meat');
INSERT into ap_item_grouping values ('703212', 'meat');
INSERT into ap_item_grouping values ('703213', 'meat');
INSERT into ap_item_grouping values ('703311', 'meat');
INSERT into ap_item_grouping values ('703312', 'meat');
INSERT into ap_item_grouping values ('703432', 'meat');
INSERT into ap_item_grouping values ('703511', 'meat');
INSERT into ap_item_grouping values ('703512', 'meat');
INSERT into ap_item_grouping values ('703612', 'meat');
INSERT into ap_item_grouping values ('703613', 'meat');
INSERT into ap_item_grouping values ('704111', 'meat');
INSERT into ap_item_grouping values ('704211', 'meat');
INSERT into ap_item_grouping values ('704212', 'meat');
INSERT into ap_item_grouping values ('704311', 'meat');
INSERT into ap_item_grouping values ('704312', 'meat');
INSERT into ap_item_grouping values ('704313', 'meat');
INSERT into ap_item_grouping values ('704314', 'meat');
INSERT into ap_item_grouping values ('704411', 'meat');
INSERT into ap_item_grouping values ('705121', 'meat');
INSERT into ap_item_grouping values ('705142', 'meat');
INSERT into ap_item_grouping values ('706111', 'meat');
INSERT into ap_item_grouping values ('706212', 'meat');
INSERT into ap_item_grouping values ('706311', 'meat');
INSERT into ap_item_grouping values ('708111', 'dairy');
INSERT into ap_item_grouping values ('708112', 'dairy');
INSERT into ap_item_grouping values ('709111', 'dairy');
INSERT into ap_item_grouping values ('709112', 'dairy');
INSERT into ap_item_grouping values ('709212', 'dairy');
INSERT into ap_item_grouping values ('709213', 'dairy');
INSERT into ap_item_grouping values ('710111', 'dairy');
INSERT into ap_item_grouping values ('710211', 'dairy');
INSERT into ap_item_grouping values ('710212', 'dairy');
INSERT into ap_item_grouping values ('710411', 'dairy');
INSERT into ap_item_grouping values ('711111', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711211', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711311', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711312', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711411', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711412', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711413', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711414', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711415', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711416', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711417', 'fruits and vegatables');
INSERT into ap_item_grouping values ('711418', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712111', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712112', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712211', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712311', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712401', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712402', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712406', 'fruits and vegatables');
INSERT into ap_item_grouping values ('712412', 'fruits and vegatables');
INSERT into ap_item_grouping values ('713111', 'fruits and vegatables');
INSERT into ap_item_grouping values ('713311', 'fruits and vegatables');
INSERT into ap_item_grouping values ('713312', 'fruits and vegatables');
INSERT into ap_item_grouping values ('714221', 'fruits and vegatables');
INSERT into ap_item_grouping values ('714232', 'fruits and vegatables');
INSERT into ap_item_grouping values ('714233', 'fruits and vegatables');
INSERT into ap_item_grouping values ('715211', 'condiments');
INSERT into ap_item_grouping values ('715311', 'condiments');
INSERT into ap_item_grouping values ('716111', 'dairy');
INSERT into ap_item_grouping values ('716113', 'dairy');
INSERT into ap_item_grouping values ('716114', 'dairy');
INSERT into ap_item_grouping values ('716116', 'dairy');
INSERT into ap_item_grouping values ('716141', 'condiments');
INSERT into ap_item_grouping values ('717112', 'drinks');
INSERT into ap_item_grouping values ('717311', 'drinks');
INSERT into ap_item_grouping values ('717325', 'drinks');
INSERT into ap_item_grouping values ('717326', 'drinks');
INSERT into ap_item_grouping values ('717412', 'drinks');
INSERT into ap_item_grouping values ('718311', 'snacks');
INSERT into ap_item_grouping values ('720111', 'drinks');
INSERT into ap_item_grouping values ('720211', 'drinks');
INSERT into ap_item_grouping values ('720221', 'drinks');
INSERT into ap_item_grouping values ('720222', 'drinks');
INSERT into ap_item_grouping values ('720311', 'drinks');
INSERT into ap_item_grouping values ('72511', 'energy');
INSERT into ap_item_grouping values ('72601', 'energy');
INSERT into ap_item_grouping values ('72610', 'energy');
INSERT into ap_item_grouping values ('72611', 'energy');
INSERT into ap_item_grouping values ('72620', 'energy');
INSERT into ap_item_grouping values ('72621', 'energy');
INSERT into ap_item_grouping values ('74714', 'energy');
INSERT into ap_item_grouping values ('74715', 'energy');
INSERT into ap_item_grouping values ('74716', 'energy');
INSERT into ap_item_grouping values ('74717', 'energy');
INSERT into ap_item_grouping values ('7471A', 'energy');
INSERT into ap_item_grouping values ('FC1101', 'meat');
INSERT into ap_item_grouping values ('FC2101', 'meat');
INSERT into ap_item_grouping values ('FC3101', 'meat');
INSERT into ap_item_grouping values ('FC4101', 'meat');
INSERT into ap_item_grouping values ('FD2101', 'meat');
INSERT into ap_item_grouping values ('FD3101', 'meat');
INSERT into ap_item_grouping values ('FD4101', 'meat');
INSERT into ap_item_grouping values ('FF1101', 'meat');
INSERT into ap_item_grouping values ('FL2101', 'fruits and vegatables');

drop table if exists ap_item_names;

create table ap_item_names (
    item_code char(6) PRIMARY KEY,
    name varchar(127) NOT NULL
);

INSERT into ap_item_names values ('701111', 'flour');
INSERT into ap_item_names values ('701311', 'rice');
INSERT into ap_item_names values ('701312', 'rice');
INSERT into ap_item_names values ('701321', 'spaghetti');
INSERT into ap_item_names values ('701322', 'spaghetti and macaroni');
INSERT into ap_item_names values ('702111', 'bread');
INSERT into ap_item_names values ('702211', 'bread');
INSERT into ap_item_names values ('702212', 'bread');
INSERT into ap_item_names values ('702213', 'bread');
INSERT into ap_item_names values ('702221', 'rolls');
INSERT into ap_item_names values ('702411', 'cupcakes');
INSERT into ap_item_names values ('702421', 'cookies');
INSERT into ap_item_names values ('703111', 'ground chuck');
INSERT into ap_item_names values ('703112', 'ground beef');
INSERT into ap_item_names values ('703113', 'ground beef');
INSERT into ap_item_names values ('703212', 'chuck roast');
INSERT into ap_item_names values ('703213', 'chuck roast');
INSERT into ap_item_names values ('703311', 'round roast');
INSERT into ap_item_names values ('703312', 'round roast');
INSERT into ap_item_names values ('703432', 'beef for stew');
INSERT into ap_item_names values ('703511', 'steak');
INSERT into ap_item_names values ('703512', 'steak');
INSERT into ap_item_names values ('703612', 'steak');
INSERT into ap_item_names values ('703613', 'steak');
INSERT into ap_item_names values ('704111', 'bacon');
INSERT into ap_item_names values ('704211', 'chops');
INSERT into ap_item_names values ('704212', 'chops');
INSERT into ap_item_names values ('704311', 'ham');
INSERT into ap_item_names values ('704312', 'ham');
INSERT into ap_item_names values ('704313', 'ham');
INSERT into ap_item_names values ('704314', 'ham');
INSERT into ap_item_names values ('704411', 'pork shoulder roast');
INSERT into ap_item_names values ('705121', 'bologna');
INSERT into ap_item_names values ('705142', 'lamb and mutton');
INSERT into ap_item_names values ('706111', 'chicken');
INSERT into ap_item_names values ('706212', 'chicken legs');
INSERT into ap_item_names values ('706311', 'turkey');
INSERT into ap_item_names values ('708111', 'eggs');
INSERT into ap_item_names values ('708112', 'eggs');
INSERT into ap_item_names values ('709111', 'milk');
INSERT into ap_item_names values ('709112', 'milk');
INSERT into ap_item_names values ('709212', 'milk');
INSERT into ap_item_names values ('709213', 'milk');
INSERT into ap_item_names values ('710111', 'butter');
INSERT into ap_item_names values ('710211', 'cheese');
INSERT into ap_item_names values ('710212', 'cheese');
INSERT into ap_item_names values ('710411', 'ice cream');
INSERT into ap_item_names values ('711111', 'apples');
INSERT into ap_item_names values ('711211', 'bananas');
INSERT into ap_item_names values ('711311', 'oranges');
INSERT into ap_item_names values ('711312', 'oranges');
INSERT into ap_item_names values ('711411', 'grapefruit');
INSERT into ap_item_names values ('711412', 'lemons');
INSERT into ap_item_names values ('711413', 'pears');
INSERT into ap_item_names values ('711414', 'peaches');
INSERT into ap_item_names values ('711415', 'strawberries');
INSERT into ap_item_names values ('711416', 'grapes');
INSERT into ap_item_names values ('711417', 'grapes');
INSERT into ap_item_names values ('711418', 'cherries');
INSERT into ap_item_names values ('712111', 'potatoes');
INSERT into ap_item_names values ('712112', 'potatoes');
INSERT into ap_item_names values ('712211', 'lettuce');
INSERT into ap_item_names values ('712311', 'tomatoes');
INSERT into ap_item_names values ('712401', 'cabbage');
INSERT into ap_item_names values ('712402', 'celery');
INSERT into ap_item_names values ('712406', 'peppers');
INSERT into ap_item_names values ('712412', 'broccoli');
INSERT into ap_item_names values ('713111', 'orange juice');
INSERT into ap_item_names values ('713311', 'apple sauce');
INSERT into ap_item_names values ('713312', 'peaches');
INSERT into ap_item_names values ('714221', 'corn');
INSERT into ap_item_names values ('714232', 'tomatoes');
INSERT into ap_item_names values ('714233', 'beans');
INSERT into ap_item_names values ('715211', 'sugar');
INSERT into ap_item_names values ('715311', 'jelly');
INSERT into ap_item_names values ('716111', 'margarine');
INSERT into ap_item_names values ('716113', 'margarine');
INSERT into ap_item_names values ('716114', 'margarine');
INSERT into ap_item_names values ('716116', 'margarine');
INSERT into ap_item_names values ('716141', 'peanut butter');
INSERT into ap_item_names values ('717112', 'cola');
INSERT into ap_item_names values ('717311', 'coffee');
INSERT into ap_item_names values ('717325', 'coffee');
INSERT into ap_item_names values ('717326', 'coffee');
INSERT into ap_item_names values ('717412', 'coffee');
INSERT into ap_item_names values ('718311', 'potato chips');
INSERT into ap_item_names values ('720111', 'malt beverages');
INSERT into ap_item_names values ('720211', 'bourbon whiskey');
INSERT into ap_item_names values ('720221', 'vodka');
INSERT into ap_item_names values ('720222', 'vodka');
INSERT into ap_item_names values ('720311', 'wine');
INSERT into ap_item_names values ('72511', 'fuel oil #2');
INSERT into ap_item_names values ('72601', 'utility (piped) gas');
INSERT into ap_item_names values ('72610', 'electricity');
INSERT into ap_item_names values ('72611', 'utility (piped) gas');
INSERT into ap_item_names values ('72620', 'utility (piped) gas');
INSERT into ap_item_names values ('72621', 'electricity');
INSERT into ap_item_names values ('74714', 'gasoline');
INSERT into ap_item_names values ('74715', 'gasoline');
INSERT into ap_item_names values ('74716', 'gasoline');
INSERT into ap_item_names values ('74717', 'automotive diesel fuel');
INSERT into ap_item_names values ('7471A', 'gasoline');
INSERT into ap_item_names values ('FC1101', 'ground beef');
INSERT into ap_item_names values ('FC2101', 'beef roast');
INSERT into ap_item_names values ('FC3101', 'steak');
INSERT into ap_item_names values ('FC4101', 'other beef (excluding veal)');
INSERT into ap_item_names values ('FD2101', 'ham');
INSERT into ap_item_names values ('FD3101', 'pork chops');
INSERT into ap_item_names values ('FD4101', 'other pork');
INSERT into ap_item_names values ('FF1101', 'chicken breast');
INSERT into ap_item_names values ('FL2101', 'lettuce');

drop table if exists ap_item_types;

create table ap_item_types (
    item_code char(6),
    type_name varchar(127) NOT NULL,
    PRIMARY KEY (item_code , type_name)
);

INSERT into ap_item_types values ('701111', 'white');
INSERT into ap_item_types values ('701311', 'white');
INSERT into ap_item_types values ('701312', 'white');
INSERT into ap_item_types values ('702111', 'white');
INSERT into ap_item_types values ('702211', 'rye');
INSERT into ap_item_types values ('702212', 'whole wheat');
INSERT into ap_item_types values ('702213', 'wheat blend');
INSERT into ap_item_types values ('702221', 'hamburger');
INSERT into ap_item_types values ('702411', 'chocolate');
INSERT into ap_item_types values ('702421', 'chocolate chip');
INSERT into ap_item_types values ('703111', '100% beef');
INSERT into ap_item_types values ('703112', '100% beef');
INSERT into ap_item_types values ('703113', 'lean and extra lean');
INSERT into ap_item_types values ('703212', 'graded and ungraded');
INSERT into ap_item_types values ('703213', 'usda choice');
INSERT into ap_item_types values ('703311', 'usda choice');
INSERT into ap_item_types values ('703312', 'graded and ungraded');
INSERT into ap_item_types values ('703432', 'boneless');
INSERT into ap_item_types values ('703511', 'round');
INSERT into ap_item_types values ('703512', 'round');
INSERT into ap_item_types values ('703612', 'sirloin');
INSERT into ap_item_types values ('703613', 'sirloin');
INSERT into ap_item_types values ('704111', 'sliced');
INSERT into ap_item_types values ('704211', 'center cut');
INSERT into ap_item_types values ('704212', 'boneless');
INSERT into ap_item_types values ('704311', 'rump or shank half');
INSERT into ap_item_types values ('704312', 'boneless');
INSERT into ap_item_types values ('704313', 'rump portion');
INSERT into ap_item_types values ('704314', 'shank portion');
INSERT into ap_item_types values ('704411', 'blade boston');
INSERT into ap_item_types values ('705121', 'all beef or mixed');
INSERT into ap_item_types values ('705142', 'bone-in');
INSERT into ap_item_types values ('706111', 'fresh');
INSERT into ap_item_types values ('706212', 'bone-in');
INSERT into ap_item_types values ('706311', 'frozen');
INSERT into ap_item_types values ('708111', 'grade a');
INSERT into ap_item_types values ('708112', 'grade aa');
INSERT into ap_item_types values ('709111', 'fresh');
INSERT into ap_item_types values ('709112', 'fresh');
INSERT into ap_item_types values ('709212', 'fresh');
INSERT into ap_item_types values ('709213', 'fresh');
INSERT into ap_item_types values ('710111', 'salted');
INSERT into ap_item_types values ('710212', 'natural');
INSERT into ap_item_types values ('710411', 'prepackaged');
INSERT into ap_item_types values ('711111', 'red delicious');
INSERT into ap_item_types values ('711311', 'navel');
INSERT into ap_item_types values ('711312', 'valencia');
INSERT into ap_item_types values ('711413', 'anjou');
INSERT into ap_item_types values ('711416', 'emperor or tokay');
INSERT into ap_item_types values ('711417', 'thompson seedless');
INSERT into ap_item_types values ('712111', 'white');
INSERT into ap_item_types values ('712112', 'white');
INSERT into ap_item_types values ('712211', 'iceberg');
INSERT into ap_item_types values ('712311', 'field grown');
INSERT into ap_item_types values ('712406', 'sweet');
INSERT into ap_item_types values ('713111', 'frozen concentrate');
INSERT into ap_item_types values ('713311', 'any variety');
INSERT into ap_item_types values ('713312', 'any variety');
INSERT into ap_item_types values ('714221', 'canned');
INSERT into ap_item_types values ('714232', 'canned');
INSERT into ap_item_types values ('714233', 'dried');
INSERT into ap_item_types values ('715211', 'white');
INSERT into ap_item_types values ('716111', 'vegetable oil blends');
INSERT into ap_item_types values ('716113', 'vegetable oil blends');
INSERT into ap_item_types values ('716116', 'soft');
INSERT into ap_item_types values ('716141', 'creamy');
INSERT into ap_item_types values ('717112', 'non diet');
INSERT into ap_item_types values ('717311', '100%');
INSERT into ap_item_types values ('717325', 'freeze dried');
INSERT into ap_item_types values ('717326', 'freeze dried');
INSERT into ap_item_types values ('717412', 'instant');
INSERT into ap_item_types values ('720111', 'all types');
INSERT into ap_item_types values ('720221', 'domestic');
INSERT into ap_item_types values ('720222', 'all types');
INSERT into ap_item_types values ('720311', 'red and white table');
INSERT into ap_item_types values ('74714', 'unleaded regular');
INSERT into ap_item_types values ('74715', 'unleaded midgrade');
INSERT into ap_item_types values ('74716', 'unleaded premium');
INSERT into ap_item_types values ('7471A', 'all types');
INSERT into ap_item_types values ('FF1101', 'boneless');
INSERT into ap_item_types values ('FL2101', 'romaine');
INSERT into ap_item_types values ('701111', 'all purpose');
INSERT into ap_item_types values ('701311', 'long grain');
INSERT into ap_item_types values ('701312', 'long grain');
INSERT into ap_item_types values ('703212', 'excluding usda prime and choice');
INSERT into ap_item_types values ('703213', 'boneless');
INSERT into ap_item_types values ('703311', 'boneless');
INSERT into ap_item_types values ('703312', 'excluding usda prime and choice');
INSERT into ap_item_types values ('703511', 'usda choice');
INSERT into ap_item_types values ('703512', 'graded and ungraded');
INSERT into ap_item_types values ('703612', 'graded and ungraded');
INSERT into ap_item_types values ('703613', 'usda choice');
INSERT into ap_item_types values ('704211', 'bone-in');
INSERT into ap_item_types values ('704311', 'bone-in');
INSERT into ap_item_types values ('704312', 'excluding canned');
INSERT into ap_item_types values ('704313', 'bone-in');
INSERT into ap_item_types values ('704314', 'bone-in');
INSERT into ap_item_types values ('704411', 'bone-in');
INSERT into ap_item_types values ('708111', 'large');
INSERT into ap_item_types values ('708112', 'large');
INSERT into ap_item_types values ('709111', 'whole');
INSERT into ap_item_types values ('709111', 'per half-gallon');
INSERT into ap_item_types values ('709112', 'whole');
INSERT into ap_item_types values ('709112', 'per gallon');
INSERT into ap_item_types values ('709212', 'low fat');
INSERT into ap_item_types values ('709212', 'per half-gallon');
INSERT into ap_item_types values ('709213', 'low fat');
INSERT into ap_item_types values ('709213', 'per gallon');
INSERT into ap_item_types values ('710111', 'grade aa');
INSERT into ap_item_types values ('714221', 'any style');
INSERT into ap_item_types values ('714232', 'any type');
INSERT into ap_item_types values ('714233', 'any type');
INSERT into ap_item_types values ('716113', 'soft');
INSERT into ap_item_types values ('717112', 'return bottles');
INSERT into ap_item_types values ('717311', 'ground roast');
INSERT into ap_item_types values ('717325', 'regular');
INSERT into ap_item_types values ('717326', 'decaf');
INSERT into ap_item_types values ('717412', 'plain');
INSERT into ap_item_types values ('701311', 'precooked');
INSERT into ap_item_types values ('701312', 'uncooked');
INSERT into ap_item_types values ('703511', 'boneless');
INSERT into ap_item_types values ('703512', 'excluding usda prime and choice');
INSERT into ap_item_types values ('703612', 'excluding usda prime and choice');
INSERT into ap_item_types values ('703613', 'boneless');
INSERT into ap_item_types values ('704311', 'smoked');
INSERT into ap_item_types values ('704313', 'smoked');
INSERT into ap_item_types values ('704314', 'smoked');
INSERT into ap_item_types values ('709111', 'fortified');
INSERT into ap_item_types values ('709112', 'fortified');
INSERT into ap_item_types values ('720222', 'any origin');
INSERT into ap_item_types values ('720311', 'any origin');
INSERT into ap_item_types values ('FC3101', 'all');
INSERT into ap_item_types values ('FC3101', 'uncooked');
INSERT into ap_item_types values ('FC2101', 'all');
INSERT into ap_item_types values ('FC2101', 'uncooked');
INSERT into ap_item_types values ('FC4101', 'all');
INSERT into ap_item_types values ('FC4101', 'uncooked');
INSERT into ap_item_types values ('FC4101', 'excluding veal');
INSERT into ap_item_types values ('FC1101', 'all');
INSERT into ap_item_types values ('FC1101', 'uncooked');
INSERT into ap_item_types values ('FD2101', 'excluding canned ham and luncheon slices');
INSERT into ap_item_types values ('FD3101', 'all pork chops');
INSERT into ap_item_types values ('FD4101', 'excluding canned ham and luncheon slices');
INSERT into ap_item_types values ('710211', 'american processed');
INSERT into ap_item_types values ('710212', 'cheddar');
insert into ap_item_types values ('72601', '40 therms');
insert into ap_item_types values ('72610', 'per KWH');
insert into ap_item_types values ('72611', '100 therms');
insert into ap_item_types values ('72620', '1 therm');
insert into ap_item_types values ('72621', 'per 500 KWH');

create table ap_area_groupings (
    area_group_id tinyint auto_increment primary key,
    area_group_name varchar(255) not null,
    ordering tinyint unsigned not null default 255
);

insert into ap_area_groupings values (1, 'Urban Areas', 1), 
(3, 'Size A Averages', 255),  
(2, 'Urban Averages', 255), 
(4, 'Class Grouping', 255);

create table ap_area_groups (
    area_code char(4) primary key,
    area_group_id tinyint not null
);

INSERT INTO `ap_area_groups` VALUES 
('0000',2),
('0100',2),
('0200',2),
('0300',2),
('0400',2),
('A000',4),
('A100',4),
('A101',1),
('A102',1),
('A103',1),
('A104',1),
('A105',1),
('A106',1),
('A200',4),
('A207',1),
('A208',1),
('A209',1),
('A210',1),
('A211',1),
('A212',1),
('A213',1),
('A214',1),
('A300',4),
('A311',1),
('A315',1),
('A316',1),
('A317',1),
('A318',1),
('A319',1),
('A320',1),
('A400',4),
('A421',1),
('A422',1),
('A423',1),
('A424',1),
('A425',1),
('A426',1),
('A427',1),
('A433',1),
('B000',4),
('B100',4),
('B200',4),
('B300',4),
('B400',4),
('C000',4),
('C100',4),
('C200',4),
('C300',4),
('C400',4),
('D000',4),
('D100',4),
('D200',4),
('D300',4),
('D400',4),
('X000',4),
('X100',4),
('X200',4),
('X300',4),
('X400',4);

GRANT SELECT ON bls.* TO 'bls_user'@'localhost' identified by 'HhI*+5oP:(X~}@-';
GRANT ALL ON bls.* TO 'bls_maintence'@'localhost' identified by 'HhI*+5oP:(X~}@-';
FLUSH PRIVILEGES;

select 
    item_code, qty_str, unit_id
from
    (SELECT 
        ap_item.item_code,
            RIGHT(LEFT(description, LOCATE(CONCAT(' ', keyword), description) - 1), LOCATE(' ', REVERSE(LEFT(description, LOCATE(CONCAT(' ', keyword), description) - 1))) - 1) as qty_str,
            units.unit_id,
            units.priority
    FROM
        ap_item
    left join ap_item_inactive ON ap_item.item_code = ap_item_inactive.item_code
    left join ap_item_unit ON ap_item.item_code = ap_item_unit.item_code
    inner join (SELECT 
        ap_item.item_code, min(priority) as priority
    FROM
        ap_item
    left join ap_item_inactive ON ap_item.item_code = ap_item_inactive.item_code
    left join ap_item_unit ON ap_item.item_code = ap_item_unit.item_code, units_search as units
    where
        LOCATE(CONCAT(' ', keyword), description) > 0 and ap_item_inactive.item_code is null and ap_item_unit.item_code is null
    group by ap_item.item_code) priorities ON ap_item.item_code = priorities.item_code, units_search as units
    where
        ap_item_inactive.item_code is null and ap_item_unit.item_code is null and units.priority = priorities.priority) unparsed_qty;