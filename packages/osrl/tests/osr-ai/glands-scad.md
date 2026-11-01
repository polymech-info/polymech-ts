// Metric Cable Glands

module cable_gland(size) {
  // Define dimensions based on the size
  if (size == "M16") {
    gland_diameter = 16;
    gland_length = 25;
    thread_diameter = 16;
    hole_diameter = 9;
    nut_thickness = 3;
  } else if (size == "M20") {
    gland_diameter = 20;
    gland_length = 30;
    thread_diameter = 20;
    hole_diameter = 12;
    nut_thickness = 3.5;
  } else if (size == "M25") {
    gland_diameter = 25;
    gland_length = 35;
    thread_diameter = 25;
    hole_diameter = 15;
    nut_thickness = 4;
  } else if (size == "M32") {
    gland_diameter = 32;
    gland_length = 40;
    thread_diameter = 32;
    hole_diameter = 20;
    nut_thickness = 5;
  } else {
    echo("Unknown size");
    return;
  }

  // Gland body
  difference() {
    cylinder(h = gland_length, d = gland_diameter, $fn=100);
    translate([0, 0, -1]) // Small overlap to ensure cut
    cylinder(h = gland_length + 2, d = hole_diameter, $fn=100);
  }

  // Thread
  translate([0, 0, gland_length - nut_thickness])
  cylinder(h = nut_thickness, d = thread_diameter, $fn=100);

  // Nut at the end
  translate([0, 0, gland_length - nut_thickness - 5])
  cylinder(h = nut_thickness, d = gland_diameter * 1.2, $fn=6); // 6-sided nut
}

// Render glands for all sizes
translate([-40, 0, 0]) cable_gland("M16");
translate([-20, 0, 0]) cable_gland("M20");
translate([0, 0, 0]) cable_gland("M25");
translate([20, 0, 0]) cable_gland("M32");