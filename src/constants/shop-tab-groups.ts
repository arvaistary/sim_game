/**
 * Конфиг распределения товаров по табам страницы «Магазин».
 *
 * Табы:
 *   — «Еда»        : продукты, напитки, доставка еды
 *   — «Обучение»   : книги, курсы, техника для учёбы, подписки на знания
 *   — «Вещи»        : одежда, косметика, подарки, развлечения, хобби-товары
 *   — «Дом»         : мебель, техника, растения, гигиена, питомцы
 */

/** ID действий таба «Еда» */
export const FOOD_ACTION_IDS: ReadonlySet<string> = new Set([
  'shop_quick_snack',
  'shop_full_lunch',
  'shop_groceries_3days',
  'shop_healthy_food',
  'shop_junk_food',
  'shop_alcohol',
  'shop_sports_nutrition',
  'shop_energy_drinks',
  'shop_meat_fish',
  'shop_veg_set',
  'shop_big_grocery',
  'shop_luxury_dinner',
  'shop_healthy_delivery',
])

/** ID действий таба «Обучение» */
export const LEARNING_ACTION_IDS: ReadonlySet<string> = new Set([
  'shop_books',
  'shop_time_management_book',
  'shop_meditation_foundations_book',
  'shop_study_laptop',
  'shop_stationery',
  'shop_fitness_membership',
  'shop_coworking',
  'shop_online_subscription',
])

/** ID действий таба «Вещи» */
export const THINGS_ACTION_IDS: ReadonlySet<string> = new Set([
  'shop_clothes',
  'shop_cosmetics',
  'shop_seasonal_clothes',
  'shop_games_entertainment',
  'shop_gift_friend',
  'shop_gift_partner',
  'shop_medicine',
  'shop_hobby_goods',
  'shop_music_instrument',
  'shop_art_supplies',
  'shop_camera',
  'shop_weekend_trip',
  'shop_auto_goods',
  'shop_kids_goods',
])

/** ID действий таба «Дом» */
export const HOME_ACTION_IDS: ReadonlySet<string> = new Set([
  'shop_household_chemicals',
  'shop_seeds_plants',
  'shop_appliance',
  'shop_small_furniture',
  'shop_hygiene',
  'shop_pet',
  'shop_garden_tools',
  'shop_cooking_set',
  'shop_meditation_cushion',
])
