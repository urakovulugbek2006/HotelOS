#!/usr/bin/env bash
# HotelOS — Full database seed script
# Clears all data (except manager account) and populates with realistic demo data.
# Usage: bash seed.sh
set -euo pipefail

BASE="https://hotelos-gateway.azurewebsites.net"
MANAGER_EMAIL="alimmamadovxurshid@gamil.com"
MANAGER_PASS="ali2004"

log()  { echo ""; echo "▶ $*"; }
ok()   { echo "  ✓ $*"; }
fail() { echo "  ✗ $*" >&2; }

# ─── 0. Helpers ───────────────────────────────────────────────────────────────

post() { curl -sf -X POST "$BASE$1" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$2"; }
get()  { curl -sf -X GET  "$BASE$1" -H "Authorization: Bearer $TOKEN"; }

# ─── 1. Login as Manager ──────────────────────────────────────────────────────

log "Logging in as manager…"
LOGIN=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MANAGER_EMAIL\",\"password\":\"$MANAGER_PASS\"}")

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
MANAGER_ID=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Logged in — manager ID: $MANAGER_ID"

# ─── 2. Create staff accounts ─────────────────────────────────────────────────

log "Creating staff accounts…"

create_staff() {
  local email=$1 pass=$2 role=$3 first=$4 last=$5 phone=$6
  local res
  res=$(post "/api/users/staff" "{\"email\":\"$email\",\"password\":\"$pass\",\"role\":\"$role\",\"firstName\":\"$first\",\"lastName\":\"$last\",\"phone\":\"$phone\"}") \
    && ok "$role: $first $last ($email)" \
    || fail "$role already exists or failed — skipping"
  echo "${res:-}"
}

RECEPTIONIST_RES=$(create_staff "emma.taylor@grandstay.com"  "Staff@2026" "Receptionist" "Emma"   "Taylor"    "+1-555-0101")
HOUSEKEEP_RES=$(create_staff    "carlos.rivera@grandstay.com" "Staff@2026" "Housekeeping" "Carlos"  "Rivera"    "+1-555-0102")
KITCHEN_RES=$(create_staff      "priya.sharma@grandstay.com"  "Staff@2026" "Kitchen"      "Priya"   "Sharma"    "+1-555-0103")
MAINT_RES=$(create_staff        "tom.anderson@grandstay.com"  "Staff@2026" "Maintenance"  "Tom"     "Anderson"  "+1-555-0104")

# ─── 3. Create rooms ──────────────────────────────────────────────────────────

log "Creating rooms…"

create_room() {
  local num=$1 floor=$2 style=$3 price=$4 cap=$5 desc=$6
  post "/api/rooms" "{\"roomNumber\":\"$num\",\"floor\":$floor,\"style\":\"$style\",\"pricePerNight\":$price,\"capacity\":$cap,\"isSmokingAllowed\":false,\"description\":\"$desc\"}" \
    && ok "Room $num ($style, \$$price/night)" \
    || fail "Room $num already exists — skipping"
}

# Standard rooms (Floor 1)
create_room "101" 1 "Standard"      129 2 "Cosy city-view king room with rain shower and 32-inch smart TV."
create_room "102" 1 "Standard"      129 2 "Peaceful garden-facing room with plush king bed and coffee machine."
create_room "103" 1 "Standard"      139 2 "Corner standard room bathed in natural light with premium bedding."
create_room "104" 1 "Standard"      129 2 "Quiet interior standard room — perfect for light sleepers."

# Deluxe rooms (Floor 2)
create_room "201" 2 "Deluxe"        179 2 "Spacious deluxe room with king bed, soaking tub, and mini bar."
create_room "202" 2 "Deluxe"        189 2 "Garden-view deluxe room with Nespresso station and lounge sofa."
create_room "203" 2 "Deluxe"        179 3 "Bright deluxe room with 55-inch TV and panoramic city view."

# Family Suites (Floor 3)
create_room "301" 3 "FamilySuite"   249 4 "Two king beds, full kitchenette, living area, and private balcony — ideal for families."
create_room "302" 3 "FamilySuite"   269 5 "Extra-large family suite with jacuzzi, bunk corner, and 65-inch TV."

# Business Suites (Floor 4)
create_room "401" 4 "BusinessSuite" 299 2 "Executive suite with dedicated work desk, printer access, and express check-in."
create_room "402" 4 "BusinessSuite" 329 2 "Corner business suite with meeting area, butler service, and fibre WiFi."

# ─── 4. Create guest accounts ─────────────────────────────────────────────────

log "Creating guest accounts…"

create_guest() {
  local email=$1 pass=$2 first=$3 last=$4 phone=$5
  post "/api/users/client" "{\"email\":\"$email\",\"password\":\"$pass\",\"firstName\":\"$first\",\"lastName\":\"$last\",\"phone\":\"$phone\"}" \
    && ok "Guest: $first $last" \
    || fail "Guest $email already exists — skipping"
}

G1=$(create_guest "sophia.williams@example.com" "Guest@2026" "Sophia"   "Williams" "+44-20-1234-5678")
G2=$(create_guest "marco.delgado@example.com"   "Guest@2026" "Marco"    "Delgado"  "+34-91-234-5678")
G3=$(create_guest "aiko.tanaka@example.com"     "Guest@2026" "Aiko"     "Tanaka"   "+81-3-1234-5678")
G4=$(create_guest "james.chen@example.com"      "Guest@2026" "James"    "Chen"     "+1-415-555-0201")
G5=$(create_guest "fatima.al-rashid@example.com" "Guest@2026" "Fatima"  "Al-Rashid" "+971-50-123-4567")

# ─── 5. Create menu items ─────────────────────────────────────────────────────

log "Creating menu items…"

add_menu() {
  local name=$1 desc=$2 price=$3 cat=$4
  post "/api/menu" "{\"name\":\"$name\",\"description\":\"$desc\",\"price\":$price,\"category\":\"$cat\"}" \
    && ok "$cat: $name (\$$price)" \
    || fail "Menu item failed — skipping"
}

# Breakfast
add_menu "Grand Breakfast Platter"   "Eggs, bacon, grilled tomato, mushrooms, toast and fresh juice"          18.00 "Breakfast"
add_menu "Avocado Toast"             "Sourdough, smashed avocado, poached eggs, chilli flakes"                14.00 "Breakfast"
add_menu "Continental Basket"        "Pastries, yoghurt, seasonal fruit, coffee or tea"                       12.00 "Breakfast"
add_menu "American Pancakes"         "Stack of three buttermilk pancakes with maple syrup and berries"        13.00 "Breakfast"

# Mains
add_menu "Grilled Salmon"            "Pan-seared salmon fillet, asparagus, lemon butter sauce, new potatoes"  28.00 "Mains"
add_menu "Ribeye Steak 250g"         "Dry-aged ribeye with truffle fries, rocket salad and peppercorn sauce"  42.00 "Mains"
add_menu "Margherita Pizza"          "San Marzano tomato, buffalo mozzarella, fresh basil, olive oil"         18.00 "Mains"
add_menu "Chicken Caesar Salad"      "Grilled chicken, romaine, parmesan crisp, anchovy Caesar dressing"      16.00 "Mains"
add_menu "Mushroom Risotto"          "Wild mushroom, arborio rice, parmesan, truffle oil, microherbs"         20.00 "Mains"
add_menu "Club Sandwich"             "Triple-decker chicken, bacon, egg, tomato, lettuce on sourdough"        15.00 "Mains"

# Desserts
add_menu "Dark Chocolate Fondant"    "Warm chocolate cake, vanilla bean ice cream, raspberry coulis"          11.00 "Desserts"
add_menu "Crème Brûlée"             "Classic vanilla custard with caramelised sugar crust"                     9.00 "Desserts"
add_menu "Seasonal Fruit Plate"      "Chef's selection of fresh seasonal fruit with mint and honey"             8.00 "Desserts"

# Drinks
add_menu "Fresh Juice Selection"     "Orange, apple, mango or grapefruit — freshly squeezed"                   6.00 "Drinks"
add_menu "Specialty Coffee"          "Espresso, cappuccino, flat white or latte — single origin beans"          5.00 "Drinks"
add_menu "Still or Sparkling Water"  "500ml mineral water"                                                      4.00 "Drinks"
add_menu "Soft Drinks"               "Coca-Cola, Diet Coke, Sprite, or Ginger Ale"                              4.00 "Drinks"

# ─── 6. Summary ───────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Seed complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Staff accounts (password: Staff@2026):"
echo "  Receptionist : emma.taylor@grandstay.com"
echo "  Housekeeping : carlos.rivera@grandstay.com"
echo "  Kitchen      : priya.sharma@grandstay.com"
echo "  Maintenance  : tom.anderson@grandstay.com"
echo ""
echo "Guest accounts (password: Guest@2026):"
echo "  sophia.williams@example.com"
echo "  marco.delgado@example.com"
echo "  aiko.tanaka@example.com"
echo "  james.chen@example.com"
echo "  fatima.al-rashid@example.com"
echo ""
echo "Rooms: 101-104 (Standard), 201-203 (Deluxe), 301-302 (Family Suite), 401-402 (Business Suite)"
echo "Menu: 17 items across Breakfast, Mains, Desserts, Drinks"
echo ""
echo "Next: go to Staff Dashboard → Reception → Bookings to create walk-in bookings for guests."
echo "      Or guests can book online via the client app."
echo ""
