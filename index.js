/**
 * StyleSync — Complete Personal AI Wardrobe Synchronization Engine
 * Vanilla JS + LocalStorage
 */

// ===================================================
// APPLICATION STATE & CONSTANTS
// ===================================================
const STORAGE_KEY = 'stylesync_app_state_v1';

const subcategoryMap = {
  Clothing: ['Tops', 'Bottoms', 'Dresses', 'Traditional Wear', 'Jackets / Outerwear'],
  Footwear: ['Sneakers', 'Heels', 'Flats', 'Sandals', 'Boots', 'Formal Shoes'],
  Handbags: ['Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Clutches', 'Tote Bags'],
  Jewelry: ['Earrings', 'Bangles', 'Necklaces'],
  Accessories: ['Watches', 'Stylish Handwear']
};

let state = {
  wardrobe: [],
  checklist: [],
  favorites: [],
  selectedOccasion: null,
  currentRecommendations: [],
  currentRecommendationIndex: 0,
  profile: {
    name: 'Bunne Varsha',
    email: 'user@stylesync.local',
    style: 'Classic & Minimalist',
    colors: 'White, Black, Beige, Navy, Gold'
  }
};

let pendingDetectionItem = null;

// ===================================================
// LOCAL STORAGE & INITIALIZATION
// ===================================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        ...parsed,
        // Enforce safe arrays
        wardrobe: parsed.wardrobe || [],
        checklist: parsed.checklist || [],
        favorites: parsed.favorites || [],
        selectedOccasion: null,
        currentRecommendations: [],
        currentRecommendationIndex: 0
      };
    }
  } catch (err) {
    console.error('Failed to load LocalStorage state:', err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      wardrobe: state.wardrobe,
      checklist: state.checklist,
      favorites: state.favorites,
      profile: state.profile
    }));
  } catch (err) {
    console.error('Failed to save to LocalStorage:', err);
  }
  updateAllMetrics();
}

// ===================================================
// AI IMAGE ANALYSIS (ISOLATED INTEGRATION POINT)
// ===================================================

/**
 * AI Image Analysis Hook
 * TODO: Replace this mock detector with a real AI vision API/model
 * (e.g. OpenAI Vision API, Google Cloud Vision, or CLIP/FashionCLIP backend endpoint).
 */
async function analyzeWardrobeImage(imageUri, fileName = '') {
  // Simulate AI model inference delay
  await new Promise(resolve => setTimeout(resolve, 350));

  const lower = fileName.toLowerCase();

  // Smart heuristic based on file naming or reasonable defaults
  if (lower.includes('shirt') || lower.includes('top') || lower.includes('blouse')) {
    return {
      name: 'Tailored Cotton Shirt',
      category: 'Clothing',
      subcategory: 'Tops',
      color: 'White',
      pattern: 'Solid',
      style: 'Smart Casual',
      occasions: ['Casual', 'College', 'Office'],
      season: 'All Season'
    };
  } else if (lower.includes('jean') || lower.includes('denim') || lower.includes('pant') || lower.includes('trouser')) {
    return {
      name: 'Classic Indigo Denim',
      category: 'Clothing',
      subcategory: 'Bottoms',
      color: 'Blue',
      pattern: 'Solid',
      style: 'Casual',
      occasions: ['Casual', 'College', 'Vacation'],
      season: 'All Season'
    };
  } else if (lower.includes('dress') || lower.includes('gown')) {
    return {
      name: 'Silk Slip Midi Dress',
      category: 'Clothing',
      subcategory: 'Dresses',
      color: 'Black',
      pattern: 'Solid',
      style: 'Elegant',
      occasions: ['Party', 'Dinner', 'Date'],
      season: 'All Season'
    };
  } else if (lower.includes('sneaker') || lower.includes('shoe')) {
    return {
      name: 'Minimalist Leather Sneakers',
      category: 'Footwear',
      subcategory: 'Sneakers',
      color: 'White',
      pattern: 'Solid',
      style: 'Casual',
      occasions: ['Casual', 'College', 'Vacation'],
      season: 'All Season'
    };
  } else if (lower.includes('bag') || lower.includes('tote') || lower.includes('clutch')) {
    return {
      name: 'Structured Leather Bag',
      category: 'Handbags',
      subcategory: 'Shoulder Bags',
      color: 'Black',
      pattern: 'Solid',
      style: 'Smart Casual',
      occasions: ['Office', 'Casual', 'Dinner'],
      season: 'All Season'
    };
  } else if (lower.includes('earring') || lower.includes('necklace') || lower.includes('jewelry')) {
    return {
      name: 'Polished Silver Hoops',
      category: 'Jewelry',
      subcategory: 'Earrings',
      color: 'Silver',
      pattern: 'Solid',
      style: 'Minimalist',
      occasions: ['Casual', 'Party', 'Office', 'Dinner'],
      season: 'All Season'
    };
  }

  // General fallback
  return {
    name: 'Wardrobe Item',
    category: 'Clothing',
    subcategory: 'Tops',
    color: 'Neutral',
    pattern: 'Solid',
    style: 'Casual',
    occasions: ['Casual', 'College'],
    season: 'All Season'
  };
}

// ===================================================
// WARDROBE MANAGEMENT
// ===================================================
function addItemToWardrobe(item) {
  state.wardrobe.unshift(item);
  saveState();
  renderWardrobeGrid();
  showToast(`Added "${item.name}" to your wardrobe.`);
}

function deleteWardrobeItem(id) {
  state.wardrobe = state.wardrobe.filter(item => item.id !== id);
  saveState();
  renderWardrobeGrid();
  showToast('Item deleted.');
}

function handleImageSelected(dataUrl, fileName = 'Uploaded Item') {
  analyzeWardrobeImage(dataUrl, fileName).then(detected => {
    pendingDetectionItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      image: dataUrl,
      createdAt: new Date().toISOString(),
      ...detected
    };
    showDetectionConfirmation(pendingDetectionItem);
  });
}

function showDetectionConfirmation(item) {
  document.getElementById('modalUploadStep').classList.add('hidden');
  document.getElementById('modalConfirmStep').classList.remove('hidden');

  document.getElementById('detectPreviewImg').src = item.image;
  document.getElementById('detectName').value = item.name;
  document.getElementById('detectCategory').value = item.category;
  
  updateSubcategories();
  document.getElementById('detectSubcategory').value = item.subcategory;

  document.getElementById('detectColor').value = item.color;
  document.getElementById('detectPattern').value = item.pattern || 'Solid';
  document.getElementById('detectStyle').value = item.style || 'Casual';
  document.getElementById('detectOccasions').value = Array.isArray(item.occasions) ? item.occasions.join(', ') : 'Casual';
  document.getElementById('detectSeason').value = item.season || 'All Season';
}

function confirmAndSaveItem(event) {
  event.preventDefault();
  if (!pendingDetectionItem) return;

  const occasionsArray = document.getElementById('detectOccasions').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const confirmedItem = {
    ...pendingDetectionItem,
    name: document.getElementById('detectName').value.trim(),
    category: document.getElementById('detectCategory').value,
    subcategory: document.getElementById('detectSubcategory').value,
    color: document.getElementById('detectColor').value.trim(),
    pattern: document.getElementById('detectPattern').value,
    style: document.getElementById('detectStyle').value,
    occasions: occasionsArray.length ? occasionsArray : ['Casual'],
    season: document.getElementById('detectSeason').value
  };

  addItemToWardrobe(confirmedItem);
  closeAddModal();
}

// Preset library for instant testing without uploading files
const samplePresets = {
  'white-shirt': {
    name: 'Crisp Oxford White Shirt',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    category: 'Clothing', subcategory: 'Tops', color: 'White', pattern: 'Solid', style: 'Smart Casual',
    occasions: ['Casual', 'College', 'Office'], season: 'All Season'
  },
  'blue-jeans': {
    name: 'Straight Leg Denim Jeans',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
    category: 'Clothing', subcategory: 'Bottoms', color: 'Blue', pattern: 'Solid', style: 'Casual',
    occasions: ['Casual', 'College', 'Vacation'], season: 'All Season'
  },
  'white-sneakers': {
    name: 'Minimal White Low Sneakers',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    category: 'Footwear', subcategory: 'Sneakers', color: 'White', pattern: 'Solid', style: 'Casual',
    occasions: ['Casual', 'College', 'Vacation'], season: 'All Season'
  },
  'black-handbag': {
    name: 'Structured Black Shoulder Bag',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    category: 'Handbags', subcategory: 'Shoulder Bags', color: 'Black', pattern: 'Solid', style: 'Smart Casual',
    occasions: ['Office', 'Casual', 'Dinner'], season: 'All Season'
  },
  'silver-earrings': {
    name: 'Sculptural Silver Drop Earrings',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
    category: 'Jewelry', subcategory: 'Earrings', color: 'Silver', pattern: 'Solid', style: 'Minimalist',
    occasions: ['Casual', 'Party', 'Office', 'Dinner'], season: 'All Season'
  },
  'black-dress': {
    name: 'Silk Slip Evening Dress',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
    category: 'Clothing', subcategory: 'Dresses', color: 'Black', pattern: 'Solid', style: 'Elegant',
    occasions: ['Party', 'Dinner', 'Date', 'Wedding'], season: 'All Season'
  }
};

function loadSamplePreset(key) {
  const preset = samplePresets[key];
  if (!preset) return;
  pendingDetectionItem = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    createdAt: new Date().toISOString(),
    ...preset
  };
  showDetectionConfirmation(pendingDetectionItem);
}

// ===================================================
// OUTFIT RECOMMENDATION & COMPATIBILITY MODEL
// ===================================================

/**
 * Main Sync Trigger: ONLY runs when user clicks '✨ Sync My Outfit'
 */
async function syncOutfit() {
  if (state.wardrobe.length === 0) {
    showToast('Please add wardrobe items first.');
    return;
  }
  if (!state.selectedOccasion) {
    showToast('Please select an occasion first.');
    return;
  }

  // Show loading state
  document.getElementById('syncLoading').classList.remove('hidden');
  document.getElementById('outfitResultCard').classList.add('hidden');

  // Simulated AI computation delay
  await new Promise(resolve => setTimeout(resolve, 600));

  state.currentRecommendations = generateOutfitRecommendations(state.wardrobe, state.selectedOccasion);
  state.currentRecommendationIndex = 0;

  document.getElementById('syncLoading').classList.add('hidden');

  if (state.currentRecommendations.length === 0) {
    showToast(`Not enough matching items for a full ${state.selectedOccasion} look.`);
    return;
  }

  renderCurrentOutfitResult();
}

/**
 * Outfit Generation Engine: Assembles ONLY from owned items
 * Selective accessories rule: NEVER force every accessory category!
 */
function generateOutfitRecommendations(wardrobe, occasion) {
  const recommendations = [];

  // Group items by category & subcategory
  const tops = wardrobe.filter(i => i.category === 'Clothing' && i.subcategory === 'Tops');
  const bottoms = wardrobe.filter(i => i.category === 'Clothing' && i.subcategory === 'Bottoms');
  const dresses = wardrobe.filter(i => i.category === 'Clothing' && (i.subcategory === 'Dresses' || i.subcategory === 'Traditional Wear'));
  const footwear = wardrobe.filter(i => i.category === 'Footwear');
  const bags = wardrobe.filter(i => i.category === 'Handbags');
  const earrings = wardrobe.filter(i => i.category === 'Jewelry' && i.subcategory === 'Earrings');
  const necklaces = wardrobe.filter(i => i.category === 'Jewelry' && i.subcategory === 'Necklaces');
  const bangles = wardrobe.filter(i => i.category === 'Jewelry' && i.subcategory === 'Bangles');
  const watches = wardrobe.filter(i => i.category === 'Accessories' && i.subcategory === 'Watches');

  // Determine base outfits: (Top + Bottom + Footwear) OR (Dress + Footwear)
  const baseOutfits = [];

  // 1. Two-piece combos
  tops.forEach(t => {
    bottoms.forEach(b => {
      footwear.forEach(f => {
        baseOutfits.push({
          type: 'separates',
          clothing: [t, b],
          footwear: f
        });
      });
    });
  });

  // 2. One-piece dresses
  dresses.forEach(d => {
    footwear.forEach(f => {
      baseOutfits.push({
        type: 'onepiece',
        clothing: [d],
        footwear: f
      });
    });
  });

  // Fallback: if user only owns tops, bottoms, or dresses without shoes yet
  if (baseOutfits.length === 0) {
    if (tops.length > 0 && bottoms.length > 0) {
      baseOutfits.push({ type: 'separates', clothing: [tops[0], bottoms[0]], footwear: footwear[0] || null });
    } else if (dresses.length > 0) {
      baseOutfits.push({ type: 'onepiece', clothing: [dresses[0]], footwear: footwear[0] || null });
    } else if (wardrobe.length > 0) {
      baseOutfits.push({ type: 'partial', clothing: [wardrobe[0]], footwear: null });
    }
  }

  // Expand base outfits with SELECTIVE accessories
  baseOutfits.forEach(base => {
    const outfitItems = [...base.clothing];
    if (base.footwear) outfitItems.push(base.footwear);

    // Contextual accessory selection
    const isFormalOrParty = ['Party', 'Wedding', 'Dinner', 'Date', 'Formal'].includes(occasion);

    // Add bag if available
    if (bags.length > 0) {
      outfitItems.push(bags[Math.floor(Math.random() * bags.length)]);
    }

    // Add earrings if available
    if (earrings.length > 0) {
      outfitItems.push(earrings[0]);
    }

    // Add necklace or bangles ONLY for formal/party occasions
    if (isFormalOrParty) {
      if (necklaces.length > 0) outfitItems.push(necklaces[0]);
      if (bangles.length > 0) outfitItems.push(bangles[0]);
    } else {
      // Casual / College might prefer watch instead
      if (watches.length > 0 && Math.random() > 0.4) {
        outfitItems.push(watches[0]);
      }
    }

    const scores = calculateCompatibility(outfitItems, occasion);

    recommendations.push({
      id: 'look_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      occasion,
      items: outfitItems,
      scores,
      explanation: generateStylingExplanation(outfitItems, occasion),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  });

  // Sort best match first
  recommendations.sort((a, b) => b.scores.overallScore - a.scores.overallScore);
  return recommendations;
}

// ===================================================
// COMPATIBILITY SCORING ENGINE
// ===================================================
function calculateCompatibility(items, occasion) {
  const colorScore = calculateColorCompatibility(items);
  const styleScore = calculateStyleCompatibility(items, occasion);
  const occasionScore = calculateOccasionCompatibility(items, occasion);
  
  const overallScore = Math.round((colorScore * 0.35) + (styleScore * 0.35) + (occasionScore * 0.30));

  return {
    colorCompatibility: colorScore,
    styleCompatibility: styleScore,
    occasionCompatibility: occasionScore,
    overallScore: Math.min(99, Math.max(78, overallScore))
  };
}

function calculateColorCompatibility(items) {
  const colors = items.map(i => (i.color || '').toLowerCase());
  
  // Neutral baseline check
  const neutrals = ['white', 'black', 'beige', 'grey', 'gray', 'silver', 'cream'];
  const hasNeutrals = colors.some(c => neutrals.includes(c));
  
  if (hasNeutrals) return 94 + (items.length % 5);
  return 88;
}

function calculateStyleCompatibility(items, occasion) {
  const styles = items.map(i => (i.style || '').toLowerCase());
  const allCasual = styles.every(s => s.includes('casual') || s.includes('minimalist'));
  if (allCasual) return 95;
  return 91;
}

function calculateOccasionCompatibility(items, occasion) {
  let matchCount = 0;
  items.forEach(item => {
    if (Array.isArray(item.occasions)) {
      if (item.occasions.some(occ => occ.toLowerCase() === occasion.toLowerCase())) {
        matchCount++;
      }
    }
  });
  const ratio = items.length > 0 ? matchCount / items.length : 0.8;
  return Math.min(98, Math.round(85 + (ratio * 12)));
}

function generateStylingExplanation(items, occasion) {
  const clothing = items.filter(i => i.category === 'Clothing').map(i => i.name.toLowerCase());
  const shoes = items.find(i => i.category === 'Footwear');
  const bag = items.find(i => i.category === 'Handbags');
  const jewelry = items.filter(i => i.category === 'Jewelry').map(i => i.name.toLowerCase());

  let text = `For this ${occasion} ensemble, the ${clothing.join(' and ') || 'selected attire'} creates a balanced foundation.`;
  if (shoes) {
    text += ` The ${shoes.name.toLowerCase()} grounds the silhouette with effortless poise.`;
  }
  if (bag) {
    text += ` Pairing this with the ${bag.name.toLowerCase()} introduces clean tonal balance.`;
  }
  if (jewelry.length > 0) {
    text += ` The ${jewelry.join(', ')} provides a refined touch without overpowering the outfit.`;
  }
  return text;
}

// ===================================================
// UI RENDERING: OUTFIT RESULT & ACTIONS
// ===================================================
function renderCurrentOutfitResult() {
  const recommendations = state.currentRecommendations;
  if (!recommendations || recommendations.length === 0) return;

  const current = recommendations[state.currentRecommendationIndex];
  const card = document.getElementById('outfitResultCard');
  card.classList.remove('hidden');

  document.getElementById('resultOccasionBadge').textContent = current.occasion + ' Look';
  document.getElementById('resultOverallScore').textContent = current.scores.overallScore + '%';

  // Progress bars
  document.getElementById('scoreColor').textContent = current.scores.colorCompatibility + '%';
  document.getElementById('barColor').style.width = current.scores.colorCompatibility + '%';

  document.getElementById('scoreStyle').textContent = current.scores.styleCompatibility + '%';
  document.getElementById('barStyle').style.width = current.scores.styleCompatibility + '%';

  document.getElementById('scoreOccasion').textContent = current.scores.occasionCompatibility + '%';
  document.getElementById('barOccasion').style.width = current.scores.occasionCompatibility + '%';

  // Grid of curated items
  const grid = document.getElementById('curatedOutfitGrid');
  grid.innerHTML = current.items.map(item => `
    <div class="curated-item">
      <img src="${item.image}" alt="${item.name}" class="curated-img" />
      <div class="curated-label">${item.subcategory || item.category}</div>
      <div class="curated-name" title="${item.name}">${item.name}</div>
    </div>
  `).join('');

  document.getElementById('resultExplanation').textContent = current.explanation;

  // Update button states
  updateFavoriteButtonState(current);
  updateChecklistButtonState(current);

  // Smooth scroll to result
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function generateAnotherOutfit() {
  if (state.currentRecommendations.length <= 1) {
    showToast('Only one optimal combination currently possible from owned items.');
    return;
  }
  state.currentRecommendationIndex = (state.currentRecommendationIndex + 1) % state.currentRecommendations.length;
  renderCurrentOutfitResult();
}

// ===================================================
// CHECKLIST & FAVORITES MANAGEMENT
// ===================================================

/**
 * IMPORTANT RULE: Generated outfits NEVER automatically enter checklist!
 * Only saved when user explicitly clicks '+ Add to Checklist'
 */
function saveCurrentToChecklist() {
  const current = state.currentRecommendations[state.currentRecommendationIndex];
  if (!current) return;

  const exists = state.checklist.some(o => o.id === current.id);
  if (exists) {
    showToast('This outfit is already in your checklist.');
    return;
  }

  state.checklist.unshift(current);
  saveState();
  updateChecklistButtonState(current);
  renderChecklistGrid();
  showToast('✓ Saved to your Outfit Checklist!');
}

function removeChecklistOutfit(id) {
  state.checklist = state.checklist.filter(o => o.id !== id);
  saveState();
  renderChecklistGrid();
  showToast('Removed from checklist.');
}

/**
 * Favorites toggle
 */
function toggleFavoriteCurrent() {
  const current = state.currentRecommendations[state.currentRecommendationIndex];
  if (!current) return;

  const index = state.favorites.findIndex(o => o.id === current.id);
  if (index > -1) {
    state.favorites.splice(index, 1);
    showToast('Removed from favorites.');
  } else {
    state.favorites.unshift(current);
    showToast('♡ Added to Favorites!');
  }
  saveState();
  updateFavoriteButtonState(current);
  renderFavoritesGrid();
}

function updateFavoriteButtonState(current) {
  const btn = document.getElementById('btnToggleFavorite');
  const isFav = state.favorites.some(o => o.id === current.id);
  if (isFav) {
    btn.innerHTML = '♥ In Favorites';
    btn.classList.add('btn-gold');
    btn.classList.remove('btn-outline');
  } else {
    btn.innerHTML = '♡ Add to Favorites';
    btn.classList.remove('btn-gold');
    btn.classList.add('btn-outline');
  }
}

function updateChecklistButtonState(current) {
  const btn = document.getElementById('btnAddToChecklist');
  const inChecklist = state.checklist.some(o => o.id === current.id);
  if (inChecklist) {
    btn.innerHTML = '✓ In Checklist';
    btn.disabled = true;
  } else {
    btn.innerHTML = '＋ Add to Checklist';
    btn.disabled = false;
  }
}

// ===================================================
// UI RENDERING: GRIDS & STATS
// ===================================================
function updateAllMetrics() {
  const wCount = state.wardrobe.length;
  const sCount = state.checklist.length;
  const fCount = state.favorites.length;

  // Home metrics
  document.getElementById('homeWardrobeCount').textContent = wCount;
  document.getElementById('homeSyncedCount').textContent = sCount;
  document.getElementById('homeFavoritesCount').textContent = fCount;

  // StyleSync page indicator
  document.getElementById('syncWardrobeCount').textContent = `${wCount} items ready for styling`;
  
  // Profile metrics
  document.getElementById('pWardrobeCount').textContent = wCount;
  document.getElementById('pSyncedCount').textContent = sCount;
  document.getElementById('pFavCount').textContent = fCount;
}

function renderWardrobeGrid() {
  const grid = document.getElementById('wardrobeGrid');
  const activeTab = document.querySelector('#wardrobeCategoryTabs .filter-tab.active')?.dataset.category || 'All';
  const searchTerm = (document.getElementById('wardrobeSearchInput')?.value || '').toLowerCase().trim();

  let items = state.wardrobe;

  if (activeTab !== 'All') {
    items = items.filter(i => i.category === activeTab);
  }

  if (searchTerm) {
    items = items.filter(i => 
      i.name.toLowerCase().includes(searchTerm) ||
      (i.color && i.color.toLowerCase().includes(searchTerm)) ||
      (i.style && i.style.toLowerCase().includes(searchTerm)) ||
      (i.subcategory && i.subcategory.toLowerCase().includes(searchTerm))
    );
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👗</div>
        <h3>Your wardrobe is waiting for you</h3>
        <p>Upload clothes, shoes, and accessories you already own to begin synchronizing outfits.</p>
        <button class="btn btn-gold" onclick="openAddModal()">＋ Add Wardrobe Item</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="wardrobe-card">
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <span class="card-category-badge">${item.subcategory || item.category}</span>
      </div>
      <div class="card-body">
        <h4 class="card-title">${item.name}</h4>
        <div class="card-tags">
          <span class="card-tag">${item.color}</span>
          <span class="card-tag">${item.style}</span>
          <span class="card-tag">${item.season}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-ghost" onclick="deleteWardrobeItem('${item.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderChecklistGrid() {
  const grid = document.getElementById('checklistGrid');
  if (state.checklist.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <h3>No saved outfits yet</h3>
        <p>Sync an outfit from your wardrobe and click "Add to Checklist" to track what you plan to wear.</p>
        <button class="btn btn-primary" onclick="navigateTo('stylesync')">Start Styling</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.checklist.map(outfit => `
    <div class="checklist-card">
      <div class="checklist-card-header">
        <div>
          <span class="badge badge-gold">${outfit.occasion}</span>
          <h4>${outfit.occasion} Look</h4>
        </div>
        <strong class="text-gold">${outfit.scores.overallScore}%</strong>
      </div>
      <div class="checklist-items-preview">
        ${outfit.items.map(i => `<img src="${i.image}" class="checklist-thumb" alt="${i.name}" title="${i.name}" />`).join('')}
      </div>
      <div class="checklist-meta">Synced on ${outfit.createdAt} • ${outfit.items.length} coordinated pieces</div>
      <div class="checklist-actions">
        <button class="btn btn-sm btn-ghost" onclick="removeChecklistOutfit('${outfit.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

function renderFavoritesGrid() {
  const grid = document.getElementById('favoritesGrid');
  if (state.favorites.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">♡</div>
        <h3>No favorite outfits yet</h3>
        <p>Click "Add to Favorites" when viewing a StyleSync outfit recommendation to keep it handy.</p>
        <button class="btn btn-primary" onclick="navigateTo('stylesync')">Style My Wardrobe</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.favorites.map(outfit => `
    <div class="checklist-card">
      <div class="checklist-card-header">
        <div>
          <span class="badge badge-gold">${outfit.occasion}</span>
          <h4>${outfit.occasion} Ensemble</h4>
        </div>
        <strong class="text-gold">${outfit.scores.overallScore}%</strong>
      </div>
      <div class="checklist-items-preview">
        ${outfit.items.map(i => `<img src="${i.image}" class="checklist-thumb" alt="${i.name}" title="${i.name}" />`).join('')}
      </div>
      <div class="checklist-meta">${outfit.explanation}</div>
    </div>
  `).join('');
}

// ===================================================
// DEMO MODE (OPTIONAL & EXPLICIT ONLY)
// ===================================================
function loadDemoWardrobe() {
  const demoItems = Object.keys(samplePresets).map(key => ({
    id: 'demo_' + key,
    createdAt: new Date().toISOString(),
    ...samplePresets[key]
  }));

  state.wardrobe = [...demoItems];
  saveState();
  renderWardrobeGrid();
  showToast('Loaded demo wardrobe items.');
}

function clearDemoWardrobe() {
  state.wardrobe = [];
  state.checklist = [];
  state.favorites = [];
  saveState();
  renderWardrobeGrid();
  renderChecklistGrid();
  renderFavoritesGrid();
  showToast('Cleared all wardrobe and outfit data.');
}

// ===================================================
// NAVIGATION & MODALS
// ===================================================
function navigateTo(viewId) {
  document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(link => link.classList.remove('active'));

  const targetView = document.getElementById('view-' + viewId);
  if (targetView) targetView.classList.add('active');

  const activeLink = document.querySelector(`.nav-item[href="#${viewId}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.getElementById('navLinks').classList.remove('open');

  if (viewId === 'wardrobe') renderWardrobeGrid();
  if (viewId === 'checklist') renderChecklistGrid();
  if (viewId === 'favorites') renderFavoritesGrid();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openAddModal() {
  resetUploadStep();
  document.getElementById('addModal').classList.remove('hidden');
}

function closeAddModal() {
  document.getElementById('addModal').classList.add('hidden');
  pendingDetectionItem = null;
}

function resetUploadStep() {
  document.getElementById('modalUploadStep').classList.remove('hidden');
  document.getElementById('modalConfirmStep').classList.add('hidden');
  document.getElementById('fileInput').value = '';
}

function updateSubcategories() {
  const cat = document.getElementById('detectCategory').value;
  const select = document.getElementById('detectSubcategory');
  const subs = subcategoryMap[cat] || ['General'];
  select.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

function saveProfile(e) {
  e.preventDefault();
  state.profile.name = document.getElementById('profName').value;
  state.profile.style = document.getElementById('profStyle').value;
  state.profile.colors = document.getElementById('profColors').value;
  document.getElementById('profileNameDisplay').textContent = state.profile.name;
  saveState();
  showToast('Profile preferences updated.');
}

// ===================================================
// EVENT LISTENERS & SETUP
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateAllMetrics();
  renderWardrobeGrid();

  // Mobile Hamburger Menu
  const hamburger = document.getElementById('hamburgerBtn');
  hamburger?.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  // Category filter tabs in wardrobe
  document.getElementById('wardrobeCategoryTabs')?.addEventListener('click', e => {
    if (e.target.classList.contains('filter-tab')) {
      document.querySelectorAll('#wardrobeCategoryTabs .filter-tab').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderWardrobeGrid();
    }
  });

  // Search input
  document.getElementById('wardrobeSearchInput')?.addEventListener('input', () => {
    renderWardrobeGrid();
  });

  // Occasion chips in StyleSync view
  document.getElementById('occasionGrid')?.addEventListener('click', e => {
    if (e.target.classList.contains('occasion-chip')) {
      document.querySelectorAll('.occasion-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      state.selectedOccasion = e.target.dataset.occasion;
      document.getElementById('syncOccasionStatus').textContent = `Target: ${state.selectedOccasion}`;
    }
  });

  // File Upload Handling
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  fileInput?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => handleImageSelected(ev.target.result, file.name);
      reader.readAsDataURL(file);
    }
  });

  dropZone?.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone?.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = ev => handleImageSelected(ev.target.result, file.name);
      reader.readAsDataURL(file);
    }
  });
});
