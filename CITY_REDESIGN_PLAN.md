# PORTFOLIO CITY MASTER PLAN
## Urban Redesign by City Planning Department

---

## DESIGN PHILOSOPHY
Create a **safe, organized, accessible city** that showcases your portfolio as distinct districts with clear navigation, pedestrian safety, and aesthetic appeal.

---

## CITY ZONES

### 🏢 ZONE 1: DOWNTOWN BUSINESS DISTRICT (Center)
**Location:** Around circular road (radius 100)
**Purpose:** Central business area with buildings creating urban canyon effect

**Buildings Layout (Inner Ring):**
- North Building: x: 0, z: -150 (50 x 30 x 40) - Company HQ
- South Building: x: 0, z: 50 (50 x 35 x 40) - Tech Center
- East Building: x: 150, z: 0 (40 x 32 x 50) - Innovation Hub
- West Building: x: -150, z: 0 (40 x 28 x 50) - Development Center
- NE Building: x: 120, z: -120 (45 x 26 x 45)
- SE Building: x: 120, z: 60 (45 x 30 x 45)
- NW Building: x: -120, z: -120 (45 x 24 x 45)
- SW Building: x: -120, z: 60 (45 x 28 x 45)

**Goal:** Buildings frame the circular road, creating city feel

---

### 🌳 ZONE 2: NORTH PARK & GARDENS (North, z > 140)
**Location:** North of circular road
**Purpose:** Green space, relaxation, decorative tech gardens

**Elements:**
- **Central Plaza:** x: 0, z: 170
  - Welcome sign
  - Benches: (±30, 170) facing inward
  - Fountain or central feature

- **East Garden - Frontend Skills:** x: 60, z: 180
  - 4 flower pots: Angular, React, HTML/CSS, JavaScript
  - Arranged in decorative pattern
  - Sign: "FRONTEND TECHNOLOGIES"

- **West Garden - DevOps Tools:** x: -60, z: 180
  - 4 flower pots: Docker, Kubernetes, AWS, Jenkins
  - Sign: "DEVOPS & CLOUD"

- **Trees (Natural Border):**
  - x: ±100, z: 160, 180, 200 (6 trees forming tree line)
  - Creates park boundary

---

### 💼 ZONE 3: CAREER MOUNTAIN RANGE (West, x < -130)
**Location:** Western district
**Purpose:** Career progression landmarks

**Career Mountains (Evenly Spaced):**
1. **Morgan Stanley:** x: -160, z: 60 (Most recent)
2. **TIAA GBS:** x: -160, z: 0 (Middle)
3. **TCS:** x: -160, z: -60 (Foundation)

**Career Journey Stream:** x: -150, z: 0 (vertical)
- Sign at x: -150, z: 80

**Benefits:**
- Spread along Z-axis for better visibility
- Further from road (60+ units clearance)
- Easy to navigate between

---

### 🎯 ZONE 4: SKILLS PLAZA (East, x > 130)
**Location:** Eastern district
**Purpose:** Technical skills showcase

**Skill Stations (Color-Coded Puddles):**

**Backend Station:** x: 160, z: 60
- Java, Spring Boot, Spring MVC, Gradle
- 4 buckets in circle pattern
- Cyan puddle (24 unit radius)
- Sign: "BACKEND DEVELOPMENT"

**Database Station:** x: 160, z: 0
- MySQL, MongoDB, PostgreSQL, Redis
- 4 buckets in circle pattern
- Green puddle (24 unit radius)
- Sign: "DATA LAYER"

**API Station:** x: 160, z: -60
- REST APIs, GraphQL, Microservices, Spring Cloud
- 4 buckets in circle pattern
- Pink puddle (24 unit radius)
- Sign: "APIs & ARCHITECTURE"

**Benefits:**
- All skills on east side (consistent)
- Spread vertically (±60)
- Clear thematic organization

---

### 📞 ZONE 5: CONTACT & WELCOME CENTER (South, z < -140)
**Location:** Southern district entrance
**Purpose:** First impression, contact information

**Lily Pond:** x: 0, z: -200 (CENTERED!)
- Main lily: Professional info
- Contact lilies: Email, Phone, GitHub
- Education lily
- Welcome sign at x: 0, z: -140

**Benefits:**
- Centered on city axis
- Natural entry point from south
- Symmetric and prominent

---

### 🚧 ZONE 6: SAFE OBJECT PLACEMENT
**Movable Objects (Strategic Positions):**

**Barrels (6 total) - Near buildings, away from road:**
- x: 50, z: 140 (North area)
- x: -50, z: 140
- x: 140, z: 100 (East area)
- x: 140, z: -100
- x: -140, z: 100 (West area)
- x: -140, z: -100

**Traffic Cones (5 total) - Pedestrian areas:**
- x: 30, z: 150 (North park)
- x: -30, z: 150
- x: 140, z: 30 (East skill area)
- x: -140, z: 30 (West career area)
- x: 0, z: -160 (South contact area)

**Benches (4 total) - Park seating:**
- x: 30, z: 170, rotation: -π/4 (North plaza, facing center)
- x: -30, z: 170, rotation: π/4
- x: 40, z: 190, rotation: 0 (Park bench)
- x: -40, z: 190, rotation: 0

**Rocks (3 total) - Decorative borders:**
- x: 0, z: -220 (South border)
- x: ±50, z: -220 (Flanking contact area)

---

### 🚶 ZONE 7: PEDESTRIAN WALKWAYS
**NPC Safe Zones:**
- **North Park:** Rectangle x: ±80, z: 140 to 200
- **East Skills:** Rectangle x: 130 to 180, z: ±80
- **West Career:** Rectangle x: -130 to -180, z: ±80
- **South Contact:** Rectangle x: ±60, z: -140 to -220
- **Inner Ring:** Radius 60-75 (inside road)

**NPC Spawn Areas:**
- Avoid circular road zone (radius 80-120)
- Spawn primarily in designated pedestrian zones
- Sidewalks along buildings

---

### 🚗 ZONE 8: ROAD SAFETY BUFFER
**Clear Zone Around Road:**
- Circular road: radius 80-120 units
- Safety buffer: ±30 units minimum
- **No objects** between radius 50-150

**Zebra Crossings (4 cardinal points):**
- North: angle 0° → (100, 0) - Connects to Park
- East: angle π/2 → (0, 100) - Connects to Skills
- South: angle π → (-100, 0) - Connects to Contact
- West: angle 3π/2 → (0, -100) - Connects to Career

---

## SAFETY IMPROVEMENTS

### ✅ IMMEDIATE FIXES:
1. **Remove** cones from (0,20), (12,0), (-12,0) - INSIDE ROAD
2. **Move** barrels away from road center
3. **Relocate** benches to North Park
4. **Centralize** lily pond on southern axis
5. **Distribute** skills across all quadrants

### ✅ CLEARANCE ZONES:
- **Road buffer:** 30 units minimum from road edges (50-150 radius)
- **Building clearance:** 20 units from building walls
- **Mountain clearance:** 30 units from base

### ✅ TRAFFIC FLOW:
- Vehicles: Stay on circular road (radius 90, 110)
- NPCs: Stay in pedestrian zones
- Crossings: Only at zebra crossings
- Slowdown: 30 unit radius from crossings

---

## VISUAL DESIGN

### 🎨 COLOR CODING:
- **Backend/Java:** Cyan/Blue (#00d4ff)
- **Frontend/Web:** Pink/Magenta (#ff00ff)
- **Database/Data:** Green (#00ff00)
- **DevOps/Cloud:** Yellow (#ffff00)

### 🏷️ SIGNAGE:
- Zone entrance signs at each district
- Directional signs at crossings
- Skill category signs above puddles
- Career timeline sign at stream

### 💡 LIGHTING:
- Buildings: Glowing windows (cyan/purple)
- Roads: Cyan lane markers
- Puddles: Colored emissive matching category
- Street lights at intersections (future)

---

## IMPLEMENTATION PRIORITIES

### Phase 1: SAFETY (CRITICAL)
1. Remove objects from road
2. Establish safety buffer zone
3. Move all objects outside radius 50-150

### Phase 2: ZONING
1. Reposition buildings around road
2. Move career mountains
3. Center lily pond
4. Spread skill stations

### Phase 3: PEDESTRIAN
1. Define NPC zones
2. Add sidewalks (visual)
3. Place benches/decorations
4. Update spawn logic

### Phase 4: POLISH
1. Add zone signage
2. Improve lighting
3. Add decorative elements
4. Performance optimization

---

## MEASUREMENTS REFERENCE

**Safe Distances:**
- Road center: radius 100
- Road inner edge: radius 80
- Road outer edge: radius 120
- Minimum object distance: radius 150+ or 50-
- Building optimal: radius 150-200
- Park zone: z > 140
- Contact zone: z < -140

**Grid System:**
- Cardinal axes: x=0, z=0
- Quadrants: NE, SE, SW, NW
- Safety circle: radius 150 from center
- City bounds: ±220 units

---

This plan creates a **safe, navigable, professional portfolio city** with clear districts, proper zoning, and zero collision hazards!