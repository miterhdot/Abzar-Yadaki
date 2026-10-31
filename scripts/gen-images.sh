#!/bin/bash
# Generate consistent product photography for Abzar Yadaki store
# Style: warm cream studio background, soft shadows, e-commerce look
OUT="/home/z/my-project/public/img"
mkdir -p "$OUT"

STYLE="professional e-commerce studio product photography, centered composition, on seamless warm cream ivory background, soft diffused lighting, gentle soft shadow under object, no text, no watermark, no logo, photorealistic, high quality"

gen() {
  local name=$1
  local prompt=$2
  local size=$3
  if [ -s "$OUT/$name.png" ]; then echo "skip $name (exists)"; return; fi
  for attempt in 1 2 3 4; do
    if z-ai image -p "$prompt, $STYLE" -o "$OUT/$name.png" -s "$size" > /dev/null 2>&1 && [ -s "$OUT/$name.png" ]; then
      echo "OK  $name"
      sleep 6
      return
    fi
    echo "  retry $name (attempt $attempt)"
    sleep $((attempt * 15))
  done
  echo "FAIL $name"
}

p10="1024x1024"

gen hero          "wide dramatic workshop workbench scene with organized power tools drills and wrenches on wooden bench, warm cinematic lighting, dark moody industrial atmosphere" "1440x720"
gen drill-hammer  "professional cordless rotary hammer drill tool with dark charcoal body and amber orange grip accents" $p10
gen angle-grinder "professional angle grinder power tool with round cutting disc, dark charcoal body with orange accents" $p10
gen cordless-drill "cordless drill driver tool with battery pack, dark gray body with orange rubber grip" $p10
gen impact-wrench "heavy duty cordless impact wrench tool with square drive, black body with orange accents" $p10

gen circular-saw  "electric circular saw power tool with round blade, charcoal and orange body" $p10
gen jigsaw        "electric jigsaw power tool with flat base plate, dark body orange handle grip" $p10
gen screwdriver-set "set of six precision screwdrivers fanned out in a row, yellow and black handles" $p10
gen wrench-set    "chrome combination wrench set arranged in neat fan layout, polished steel" $p10
gen adjustable-wrench "single adjustable wrench spanner, polished chrome steel, isolated" $p10

gen hammer        "steel claw hammer with wooden handle, carpenter tool" $p10
gen pliers        "combination pliers tool with red rubber insulated handles" $p10
gen tape-measure  "yellow tape measure with extended measuring blade" $p10
gen laser-measure "compact laser distance meter measuring device, dark body with green display" $p10
gen caliper       "digital electronic caliper measuring tool, stainless steel with LCD display" $p10

gen brake-pads    "car disc brake pads pair, automotive spare part" $p10
gen oil-filter    "car engine oil filter cylinder, blue and white automotive part" $p10
gen spark-plug    "four iridium spark plugs standing in a row, automotive engine part" $p10
gen car-battery   "car battery 12v automotive battery with terminals, dark green case" $p10
gen timing-belt   "car timing belt kit with metal tensioner pulley, automotive part" $p10

gen hard-hat      "construction safety hard hat helmet, amber yellow color" $p10
gen work-gloves   "pair of heavy duty work gloves with rubber coating, black and orange" $p10
gen safety-goggles "protective safety goggles glasses clear lens with adjustable strap" $p10
gen toolbox       "open metal toolbox cantilever with organized tools inside" $p10
gen tool-chest    "rolling tool chest cabinet with multiple drawers, red metal" $p10

gen trowel        "masonry trowel tool with wooden handle and steel blade" $p10
gen spirit-level  "aluminum spirit level tool, yellow body with green vials" $p10
gen bolt-nuts     "assorted steel bolts nuts and washers pile, metal fasteners" $p10
gen paint-roller  "paint roller brush with tray, construction painting tools" $p10
echo "=== DONE: $(ls $OUT/*.png 2>/dev/null | wc -l) images ==="
