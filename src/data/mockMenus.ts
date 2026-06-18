import { PlaceMenu } from '../types/schema';

export const MOCK_MENUS: PlaceMenu[] = [
  {
    businessId: 'place_1', // Ovio - Maadi
    sections: [
      {
        sectionId: 'p1_s1',
        title: 'All Day Breakfast',
        items: [
          {
            itemId: 'p1_s1_i1',
            name: 'Ovio Classic Pancakes',
            price: 180,
            currency: 'EGP',
            description: 'Fluffy buttermilk pancakes served with fresh berries, maple syrup, and whipped butter.',
            tags: ['Popular', 'Sweet'],
            photo: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200'
          },
          {
            itemId: 'p1_s1_i2',
            name: 'Avocado Toast',
            price: 210,
            currency: 'EGP',
            description: 'Toasted sourdough with mashed avocado, poached eggs, feta cheese, and cherry tomatoes.',
            tags: ['Healthy', 'Veg'],
            photo: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=200'
          },
          {
            itemId: 'p1_s1_i3',
            name: 'Eggs Benedict',
            price: 195,
            currency: 'EGP',
            description: 'Poached eggs on English muffin with smoked turkey and hollandaise sauce.',
            tags: ['Popular']
          }
        ]
      },
      {
        sectionId: 'p1_s2',
        title: 'Hot & Cold Drinks',
        items: [
          {
            itemId: 'p1_s2_i1',
            name: 'Spanish Latte',
            price: 95,
            currency: 'EGP',
            description: 'Rich espresso with condensed milk and steamed milk.',
            tags: ['Hot', 'Sweet']
          },
          {
            itemId: 'p1_s2_i2',
            name: 'Iced Matcha Latte',
            price: 110,
            currency: 'EGP',
            description: 'Grounded green tea matcha whisked with cold milk and sweet syrup.',
            tags: ['Cold', 'Healthy']
          }
        ]
      }
    ],
    menuPhotos: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500'
    ]
  },
  {
    businessId: 'place_2', // Sky Rim Lounge
    sections: [
      {
        sectionId: 'p2_s1',
        title: 'Appetizers',
        items: [
          {
            itemId: 'p2_s1_i1',
            name: 'Dynamite Shrimp',
            price: 290,
            currency: 'EGP',
            description: 'Tempura battered shrimp tossed in a spicy, creamy sriracha mayo sauce.',
            tags: ['Spicy', 'Seafood'],
            photo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200'
          },
          {
            itemId: 'p2_s1_i2',
            name: 'Nacho Mountain',
            price: 220,
            currency: 'EGP',
            description: 'Tortilla chips topped with melted cheddar, jalapenos, sour cream, and fresh pico de gallo.',
            tags: ['Sharing', 'Veg']
          }
        ]
      },
      {
        sectionId: 'p2_s2',
        title: 'Mains & Steaks',
        items: [
          {
            itemId: 'p2_s2_i1',
            name: 'Grilled Ribeye Steak',
            price: 750,
            currency: 'EGP',
            description: 'Prime ribeye steak served with truffle mashed potatoes and grilled asparagus.',
            tags: ['Signature', 'Meat']
          },
          {
            itemId: 'p2_s2_i2',
            name: 'Sky Rim Burger',
            price: 310,
            currency: 'EGP',
            description: 'Double beef patty, cheddar, crispy bacon, and sky rim special sauce in brioche.',
            tags: ['Popular']
          }
        ]
      }
    ],
    menuPhotos: [
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500'
    ]
  },
  {
    businessId: 'place_3', // Cake Cafe - Zayed
    sections: [
      {
        sectionId: 'p3_s1',
        title: 'Gourmet Cakes',
        items: [
          {
            itemId: 'p3_s1_i1',
            name: 'Red Velvet Cake Slice',
            price: 110,
            currency: 'EGP',
            description: 'Signature homemade red velvet cake with creamy vanilla frosting.',
            tags: ['Sweet', 'Best Seller'],
            photo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200'
          },
          {
            itemId: 'p3_s1_i2',
            name: 'San Sebastian Cheesecake',
            price: 130,
            currency: 'EGP',
            description: 'Burnt Basque-style cheesecake served with warm Belgian milk chocolate pour-over.',
            tags: ['Popular']
          }
        ]
      },
      {
        sectionId: 'p3_s2',
        title: 'Signature Coffee',
        items: [
          {
            itemId: 'p3_s2_i1',
            name: 'Caramel Macchiato',
            price: 85,
            currency: 'EGP',
            description: 'Double shot of espresso, steamed milk, and sweet vanilla and caramel syrup.',
            tags: ['Hot']
          }
        ]
      }
    ],
    menuPhotos: [
      'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500'
    ]
  },
  {
    businessId: 'place_4', // Crimson Nile Lounge
    sections: [
      {
        sectionId: 'p4_s1',
        title: 'Mediterranean Tapas',
        items: [
          {
            itemId: 'p4_s1_i1',
            name: 'Grilled Octopus',
            price: 450,
            currency: 'EGP',
            description: 'Tender grilled octopus tentacles served over potato cream and smoked paprika oil.',
            tags: ['Seafood', 'Signature']
          }
        ]
      },
      {
        sectionId: 'p4_s2',
        title: 'Luxury Main Plates',
        items: [
          {
            itemId: 'p4_s2_i1',
            name: 'Seafood Paella',
            price: 680,
            currency: 'EGP',
            description: 'Saffron rice cooked with fresh shrimp, calamari, mussels, and bell peppers.',
            tags: ['Sharing', 'Seafood']
          },
          {
            itemId: 'p4_s2_i2',
            name: 'Angus Beef Tenderloin',
            price: 820,
            currency: 'EGP',
            description: 'Angus beef tenderloin served with pepper sauce and rosemary potatoes.',
            tags: ['Meat']
          }
        ]
      }
    ],
    menuPhotos: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500'
    ]
  },
  {
    businessId: 'place_5', // Espresso Lab - Zayed
    sections: [
      {
        sectionId: 'p5_s1',
        title: 'Single-Origin Coffee',
        items: [
          {
            itemId: 'p5_s1_i1',
            name: 'Ethiopia V60',
            price: 95,
            currency: 'EGP',
            description: 'Lightly roasted single-origin Ethiopian beans brewed with the V60 method, showing floral and citrus notes.',
            tags: ['Filter', 'Hot']
          },
          {
            itemId: 'p5_s1_i2',
            name: 'Colombia Chemex',
            price: 110,
            currency: 'EGP',
            description: 'Chemex filter brew of Colombian single-origin beans, with chocolatey notes and a smooth body.',
            tags: ['Filter']
          }
        ]
      },
      {
        sectionId: 'p5_s2',
        title: 'Lab Specials',
        items: [
          {
            itemId: 'p5_s2_i1',
            name: 'Iced Pistachio Latte',
            price: 110,
            currency: 'EGP',
            description: 'Espresso, milk, and sweet pistachio sauce served over ice.',
            tags: ['Sweet', 'Cold']
          }
        ]
      }
    ],
    menuPhotos: []
  },
  {
    businessId: 'place_6', // Zooba - Heliopolis
    sections: [
      {
        sectionId: 'p6_s1',
        title: 'Baladi Sandwiches',
        items: [
          {
            itemId: 'p6_s1_i1',
            name: 'Gourmet Taameya',
            price: 45,
            currency: 'EGP',
            description: 'Crispy taameya in baladi bread with tahini, arugula, and pickled lemon.',
            tags: ['Veg', 'Traditional', 'Popular']
          },
          {
            itemId: 'p6_s1_i2',
            name: 'Fava Beans Spicy oil',
            price: 40,
            currency: 'EGP',
            description: 'Slow-cooked fava beans with olive oil, cumin, garlic, and hot pepper sauce.',
            tags: ['Veg', 'Traditional']
          }
        ]
      },
      {
        sectionId: 'p6_s2',
        title: 'Egyptian Boxes',
        items: [
          {
            itemId: 'p6_s2_i1',
            name: 'Signature Koshary Box',
            price: 70,
            currency: 'EGP',
            description: 'Traditional Egyptian koshary served with hot tomato sauce, crispy onions, and garlic vinegar.',
            tags: ['Traditional', 'Popular', 'Vegan']
          }
        ]
      }
    ],
    menuPhotos: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500'
    ]
  }
];
