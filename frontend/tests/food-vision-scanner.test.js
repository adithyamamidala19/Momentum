import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOOD_DATABASE,
  calculateItemNutrition,
  calculateMealTotals,
  SAMPLE_MEALS
} from '../src/services/foodNutritionDatabase.js';
import {
  synthesizeMealFromAnalysis,
  saveMealScanToHistory,
  getSavedMealScans
} from '../src/services/foodVisionService.js';

test('1. USDA Food Database Integrity & Atwater Caloric Precision', () => {
  // Check chicken breast
  const chicken = calculateItemNutrition('chicken-breast', 100);
  assert.equal(chicken.protein, 31.0);
  assert.equal(chicken.calories, 165);
  assert.equal(chicken.grams, 100);

  // Check salmon at 200g
  const salmon = calculateItemNutrition('salmon-fillet', 200);
  assert.equal(salmon.protein, 44.0);
  assert.equal(salmon.fat, 26.0);
  assert.equal(salmon.calories, 416); // 208 * 2
  assert.equal(salmon.grams, 200);

  // Check brown rice at 150g
  const rice = calculateItemNutrition('brown-rice', 150);
  assert.equal(rice.grams, 150);
  assert.equal(rice.calories, 168); // 112 * 1.5
  assert.equal(rice.carbs, 35.3); // 23.5 * 1.5 rounded to 1 decimal
});

test('2. Total Meal Macro Aggregation & Gram Precision', () => {
  const items = [
    calculateItemNutrition('chicken-breast', 180),
    calculateItemNutrition('brown-rice', 150),
    calculateItemNutrition('steamed-broccoli', 100)
  ];

  const totals = calculateMealTotals(items);
  assert.equal(totals.totalGrams, 430); // 180 + 150 + 100

  // Expected calories: Chicken (180/100 * 165 = 297) + Rice (150/100 * 112 = 168) + Broccoli (100/100 * 35 = 35) = 500 kcal
  assert.equal(totals.totalCalories, 500);

  // Expected protein: Chicken (55.8) + Rice (3.9) + Broccoli (2.4) = 62.1g
  assert.ok(Math.abs(totals.totalProtein - 62.1) < 0.1);
});

test('3. Visual Spectrum Cluster Synthesis to Food Items & Pins', () => {
  // Mock image analysis with high salmon pink and green spear proportions
  const mockSalmonAnalysis = {
    dimensions: { width: 400, height: 400 },
    proportions: {
      greens: 0.10,
      warmBrowns: 0.02,
      salmonPink: 0.15,
      orange: 0.01,
      whiteYellow: 0.09,
      berries: 0.00
    },
    centroids: {
      green: { x: 65, y: 60 },
      protein: { x: 50, y: 40 },
      carb: { x: 35, y: 65 },
      orange: { x: 60, y: 55 }
    }
  };

  const meal = synthesizeMealFromAnalysis(mockSalmonAnalysis);
  assert.ok(meal.title.includes('Salmon'));
  assert.ok(meal.items.some(i => i.id === 'salmon-fillet'));
  assert.ok(meal.items.some(i => i.id === 'steamed-asparagus'));
  assert.ok(meal.totals.totalCalories > 300);
  assert.ok(meal.totals.totalProtein > 30);
  assert.ok(meal.items[0].pin.x > 0);
  assert.ok(meal.items[0].pin.y > 0);
});

test('4. Curated Sample Meals Verification', () => {
  assert.ok(SAMPLE_MEALS.length >= 6);
  SAMPLE_MEALS.forEach(sample => {
    assert.ok(sample.id);
    assert.ok(sample.title);
    assert.ok(sample.imageUrl);
    assert.ok(sample.items.length >= 3);
    sample.items.forEach(it => {
      assert.ok(FOOD_DATABASE[it.foodId], `Food ${it.foodId} should exist in database`);
      assert.ok(it.grams > 0);
      assert.ok(it.pin.x >= 0 && it.pin.x <= 100);
      assert.ok(it.pin.y >= 0 && it.pin.y <= 100);
    });
  });
});
