/* @pjs font="fonts/fixed_01.ttf"; */

class Coordinate {
	int [] x = new int [2];
	float y;

	Coordinate (data) {
		x[0] = getUnixTime(data.startDate);
		x[1] = getUnixTime(data.endDate);
		y = data.value;
	}	
}

PFont font;

Coordinate [] coordinates;
float x_scale, y_scale;
float x_offset, y_offset;

void setup() {
  background(255);
  font = createFont("fonts/fixed_01.ttf");
  textFont(font, 8);
  bls.load();
}

void loadData (data) {
	float y_min = 100000000, y_max = 0;
	int x_min, x_max;
	Coordinate [] cleanData = new Object [data.length];
	for (int index = 0; index < data.length; index++) {
		cleanData[index] = new Coordinate(data[index]);
		y_min = min(y_min, cleanData[index].y);
		y_max = max(y_max, cleanData[index].y);
	}
	x_min = cleanData[0].x[0];
	x_max = cleanData[cleanData.length - 1].x[1];
	coordinates = cleanData;

	x_scale = width/(x_max - x_min);
	y_scale = (height-100)/(y_max - y_min);

	x_offset = x_min * x_scale;
	y_offset = y_min * y_scale;
}

void update () {
	float y_min = 100000000, y_max = 0;
	int x_min, x_max;

	for (int index = 0; index < coordinates.length; index++) {
		y_min = min(y_min, coordinates[index].y);
		y_max = max(y_max, coordinates[index].y);
	}
	x_min = coordinates[0].x[0];
	x_max = coordinates[coordinates.length - 1].x[1];

	x_scale = width/(x_max - x_min);
	y_scale = (height-100)/(y_max - y_min);

	x_offset = x_min * x_scale;
	y_offset = y_min * y_scale;
	redraw();
}

int getUnixTime(dateStr) {
	String[] dateTimeSplit = split(dateStr, 'T');
	int[] dateComponents = int(split(dateTimeSplit[0], '-'));
	int unix = (dateComponents[0] - 1970) * 86400 * 365.25;
	unix = unix + (dateComponents[1] - 1) * 86400 * 365.25 /12;
	unix = unix + (dateComponents[2] - 1) * 86400;
	return unix;
}

void draw() {
background(255);
	if (coordinates) {
		for (int index = 0; index < coordinates.length - 1; index++) {
			line(coordinates[index].x[0]*x_scale - x_offset, height - coordinates[index].y*y_scale + y_offset - 50, coordinates[index].x[1]*x_scale - x_offset, height - coordinates[index].y*y_scale + y_offset - 50);
			line(coordinates[index].x[1]*x_scale - x_offset, height - coordinates[index].y*y_scale + y_offset - 50, coordinates[index+1].x[0]*x_scale - x_offset, height - coordinates[index+1].y*y_scale + y_offset - 50);
		}
	}
	fill(0);
	text(mouseX, 100, 100);
	text(mouseY, 100, 120);
}

void mouseMoved () {
	
}

void mouseOver() {
	
}