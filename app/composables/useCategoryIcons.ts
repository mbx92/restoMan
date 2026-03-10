/**
 * Curated list of Tabler icons suitable for restaurant categories.
 * Returns icon name → display label pairs for the icon picker.
 */
export const useCategoryIcons = () => {
  const iconOptions = [
    { value: 'meat', label: 'Daging' },
    { value: 'fish', label: 'Ikan' },
    { value: 'egg', label: 'Telur' },
    { value: 'bread', label: 'Roti' },
    { value: 'soup', label: 'Sup' },
    { value: 'salad', label: 'Salad' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'grill', label: 'Grill' },
    { value: 'coffee', label: 'Kopi' },
    { value: 'tea', label: 'Teh' },
    { value: 'glass', label: 'Minuman' },
    { value: 'bottle', label: 'Botol' },
    { value: 'beer', label: 'Bir' },
    { value: 'milk', label: 'Susu' },
    { value: 'ice-cream', label: 'Es Krim' },
    { value: 'cake', label: 'Kue' },
    { value: 'cookie', label: 'Kue Kering' },
    { value: 'candy', label: 'Permen' },
    { value: 'fruit', label: 'Buah' },
    { value: 'cheese', label: 'Keju' },
    { value: 'pepper', label: 'Sambal' },
    { value: 'bowl', label: 'Mangkok' },
    { value: 'tools-kitchen', label: 'Dapur' },
    { value: 'chef-hat', label: 'Chef' },
    { value: 'package', label: 'Paket' },
    { value: 'star', label: 'Favorit' },
    { value: 'flame', label: 'Pedas' },
    { value: 'leaf', label: 'Vegetarian' },
    { value: 'heart', label: 'Sehat' },
    { value: 'category', label: 'Lainnya' },
  ]

  return { iconOptions }
}
