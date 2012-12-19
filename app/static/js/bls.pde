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

int xPos, yPos;

PFont font;

Coordinate [] coordinates;
float x_scale, y_scale;
float x_offset, y_offset;
boolean isMouseOver = false;
int [] monthLengths = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

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
	return bls.getUnixTime(dateStr);
}

String getDate(unix) {
	Object date = bls.getDateTime(unix);
	int [] values = {date.getFullYear(), date.getMonth() + 1, date.getDate()};
	return join(nf(values,2), '-');
}

void draw() {
	background(255);
	if (coordinates) {
		if (isMouseOver) {
			float x_value = (xPos + x_offset)/x_scale;
			float y_value = find_y(x_value);
			int y_pos = height-y_value*y_scale + y_offset - 50;
			String date =getDate(x_value);
			fill(0);
			text(date, 10, 20);
			text(y_value, 10, 40);
			stroke(164);
			fill(64);
			text(date, xPos + 10, y_pos - 30);
			text(y_value, xPos + 10, y_pos - 10);
			line(xPos, 0, xPos,  height);
			line(0, y_pos, width, y_pos);
		}
		stroke(0);
		for (int index = 0; index < coordinates.length - 1; index++) {
			line(coordinates[index].x[0]*x_scale - x_offset, height - coordinates[index].y*y_scale + y_offset - 50, coordinates[index].x[1]*x_scale - x_offset, height - coordinates[index].y*y_scale + y_offset - 50);
			line(coordinates[index].x[1]*x_scale - x_offset, height - coordinates[index].y*y_scale + y_offset - 50, coordinates[index+1].x[0]*x_scale - x_offset, height - coordinates[index+1].y*y_scale + y_offset - 50);
		}
	}
}

float find_y (x_value) {
	float y;
	for (int index = 0; index < coordinates.length && coordinates[index].x[0] < x_value; index++) {
		y = coordinates[index].y;
	}
	return y;
}

void touchStart(TouchEvent touchEvent) {
	xPos = touchEvent.touches[0].offsetX;
	isMouseOver = true;
}

void touchEnd(TouchEvent touchEvent) {
	isMouseOver = false;
}

void touchMove(TouchEvent touchEvent) {
	xPos = touchEvent.touches[0].offsetX;
}

void mouseOver() {
	isMouseOver = true;
}

void mouseOut () {
	isMouseOver = false;
}

void mouseMoved () {
	xPos = mouseX;
}