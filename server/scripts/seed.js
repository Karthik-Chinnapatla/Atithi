const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { User } = require('../models/User');
const { Restaurant } = require('../models/Restaurant');
const { Review } = require('../models/Review');

const SEED_USERS = [
  {
    name: 'Elena Vance',
    email: 'admin@atithi.com',
    password: 'Admin@1234',
    role: 'ADMIN',
  },
  {
    name: 'Marco Rossi',
    email: 'owner1@atithi.com',
    password: 'Owner@1234',
    role: 'RESTAURANT_OWNER',
  },
  {
    name: 'Kenji Takahashi',
    email: 'owner2@atithi.com',
    password: 'Owner@1234',
    role: 'RESTAURANT_OWNER',
  },
  {
    name: 'Priya Nair',
    email: 'owner3@atithi.com',
    password: 'Owner@1234',
    role: 'RESTAURANT_OWNER',
  },
  {
    name: 'Camille Laurent',
    email: 'owner4@atithi.com',
    password: 'Owner@1234',
    role: 'RESTAURANT_OWNER',
  },
  {
    name: 'Liam Carter',
    email: 'customer1@atithi.com',
    password: 'Customer@1234',
    role: 'CUSTOMER',
  },
  {
    name: 'Sophia Chen',
    email: 'customer2@atithi.com',
    password: 'Customer@1234',
    role: 'CUSTOMER',
  },
  {
    name: 'Noah Patel',
    email: 'customer3@atithi.com',
    password: 'Customer@1234',
    role: 'CUSTOMER',
  },
  {
    name: 'Maya Brooks',
    email: 'customer4@atithi.com',
    password: 'Customer@1234',
    role: 'CUSTOMER',
  },
  {
    name: 'Ethan Rivera',
    email: 'customer5@atithi.com',
    password: 'Customer@1234',
    role: 'CUSTOMER',
  },
  {
    name: 'Aria Kim',
    email: 'customer6@atithi.com',
    password: 'Customer@1234',
    role: 'CUSTOMER',
  },
];

const SEED_RESTAURANTS = [
  {
    name: 'Deccan Nizami Kitchen',
    description:
      'Slow-cooked dum biryani, stone-ground haleem, smoked shikampuri kebabs, and royal Nizami curries served in a heritage courtyard in Banjara Hills.',
    location: 'Banjara Hills, Hyderabad',
    address: 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034',
    cuisine: ['Hyderabadi', 'Mughlai', 'Biryani'],
    image:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2335 0142',
    priceRange: '$$$',
    ownerEmail: 'owner1@atithi.com',
  },
  {
    name: 'Kuroshio Teppan & Sushi',
    description:
      'Seasonal nigiri, robatayaki charcoal skewers, house-fermented pickles, and artisanal ramen crafted fresh in Jubilee Hills.',
    location: 'Jubilee Hills, Hyderabad',
    address: 'Plot 482, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    cuisine: ['Japanese', 'Sushi', 'Asian'],
    image:
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2355 0188',
    priceRange: '$$$$',
    ownerEmail: 'owner2@atithi.com',
  },
  {
    name: 'Dakshin Spice & Curry',
    description:
      'Coastal South Indian specialties celebrating freshly roasted whole spices, flaky appams, Malabar stews, and crisp dosas.',
    location: 'HITEC City, Hyderabad',
    address: 'Cyber Towers Road, HITEC City, Hyderabad, Telangana 500081',
    cuisine: ['South Indian', 'Coastal', 'Vegetarian'],
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2311 0194',
    priceRange: '$$',
    ownerEmail: 'owner3@atithi.com',
  },
  {
    name: 'Concu Boulangerie & Bistro',
    description:
      'Sunlit Film Nagar patisserie and bistro known for flaky croissants, artisanal sourdough tartines, single-origin pour-overs, and weekend brunch.',
    location: 'Film Nagar, Hyderabad',
    address: 'Plot 19, Road No. 82, Film Nagar, Hyderabad, Telangana 500096',
    cuisine: ['French', 'Bakery', 'Brunch'],
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2354 0167',
    priceRange: '$$$',
    ownerEmail: 'owner4@atithi.com',
  },
  {
    name: 'Toscana Trattoria',
    description:
      'Handmade Italian pasta, blistered wood-fired Neapolitan pizzas, and herbed focaccia served in a relaxed Jubilee Hills garden setting.',
    location: 'Jubilee Hills, Hyderabad',
    address: 'Road No. 45, Jubilee Hills, Hyderabad, Telangana 500033',
    cuisine: ['Italian', 'Wood-Fired', 'Continental'],
    image:
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2355 0123',
    priceRange: '$$',
  },
  {
    name: 'Charminar Darbar & Kebabs',
    description:
      'Classic Old City kitchen grilling tender patthar ka gosht, saffron chicken biryani, and warm sheer khurma steps away from Charminar.',
    location: 'Charminar, Hyderabad',
    address: 'Laad Bazaar Road, Near Charminar, Hyderabad, Telangana 500002',
    cuisine: ['Hyderabadi', 'Kebabs', 'Biryani'],
    image:
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2452 0175',
    priceRange: '$$',
  },
  {
    name: 'Seoul Ember BBQ',
    description:
      'Contemporary Korean tabletop grill in Gachibowli serving smoky bulgogi, spicy kimchi jjigae, crispy pancakes, and chilled noodles.',
    location: 'Gachibowli, Hyderabad',
    address: 'SLN Terminus Road, Gachibowli, Hyderabad, Telangana 500032',
    cuisine: ['Korean', 'BBQ', 'Asian'],
    image:
      'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2300 0131',
    priceRange: '$$$',
  },
  {
    name: 'Siam Lotus Street Kitchen',
    description:
      'Vibrant Madhapur noodle bar known for wok-charred pad see ew, aromatic Thai green curry, crispy papaya salad, and Thai iced tea.',
    location: 'Madhapur, Hyderabad',
    address: '100 Feet Road, Ayyappa Society, Madhapur, Hyderabad, Telangana 500081',
    cuisine: ['Thai', 'Noodles', 'Street Food'],
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2311 0155',
    priceRange: '$',
  },
  {
    name: 'Koyla Charcoal Grill',
    description:
      'Open-air Kondapur rooftop serving smoky tandoori platters, slow-simmered dal makhani, butter-brushed kulchas, and spiced mocktails.',
    location: 'Kondapur, Hyderabad',
    address: 'Botanical Garden Road, Kondapur, Hyderabad, Telangana 500084',
    cuisine: ['North Indian', 'BBQ', 'Tandoor'],
    image:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2301 0190',
    priceRange: '$$',
  },
  {
    name: 'Olive & Courtyard Kitchen',
    description:
      'Bright Mediterranean mezze house in Begumpet featuring whipped feta, harissa-glazed skewers, wood-baked pita, and sunny weekend brunch.',
    location: 'Begumpet, Hyderabad',
    address: 'Greenlands Road, Begumpet, Hyderabad, Telangana 500016',
    cuisine: ['Mediterranean', 'Cafe', 'Brunch'],
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2340 0118',
    priceRange: '$$$',
  },
  {
    name: 'Marigold Botanical Cafe',
    description:
      'All-day plant-forward cafe in Gachibowli highlighting millet grain bowls, roasted cauliflower steaks, herbal infusions, and gluten-free bakes.',
    location: 'Gachibowli, Hyderabad',
    address: 'Financial District Link Road, Gachibowli, Hyderabad, Telangana 500032',
    cuisine: ['Vegetarian', 'Cafe', 'Healthy'],
    image:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2300 0162',
    priceRange: '$',
  },
  {
    name: 'Godavari Coastal House',
    description:
      'Newly opened Financial District dining room celebrating fiery Andhra seafood, gongura mutton, and coastal Konaseema specialties.',
    location: 'Financial District, Hyderabad',
    address: 'Nanakramguda Road, Financial District, Hyderabad, Telangana 500032',
    cuisine: ['Andhra', 'Seafood', 'South Indian'],
    image:
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80',
    phone: '+91 40 2300 0199',
    priceRange: '$$$$',
  },
];

// Reviews intentionally leave 'Marigold Botanical Cafe' & 'Godavari Coastal House' unreviewed ("No ratings yet")
const SEED_REVIEWS = [
  {
    customerEmail: 'customer1@atithi.com',
    restaurantName: 'Deccan Nizami Kitchen',
    rating: 5,
    comment: 'The saffron mutton dum biryani and mirchi ka salan were extraordinary. Warm hospitality in a calm Banjara Hills courtyard.',
  },
  {
    customerEmail: 'customer2@atithi.com',
    restaurantName: 'Deccan Nizami Kitchen',
    rating: 5,
    comment: 'Best shikampuri kebabs and double ka meetha in Banjara Hills. Request the courtyard seating!',
  },
  {
    customerEmail: 'customer3@atithi.com',
    restaurantName: 'Deccan Nizami Kitchen',
    rating: 4,
    comment: 'Rich flavors and fragrant basmati rice. Slightly busy on Friday evenings, yet worth every minute.',
  },
  {
    customerEmail: 'customer4@atithi.com',
    restaurantName: 'Deccan Nizami Kitchen',
    rating: 4,
    comment: 'Delicious haleem starter and attentive staff. Great spot for family dinners in Hyderabad.',
  },
  {
    customerEmail: 'customer1@atithi.com',
    restaurantName: 'Kuroshio Teppan & Sushi',
    rating: 5,
    comment: 'Every piece of nigiri was super fresh and balanced. Easily the finest Japanese dining room in Jubilee Hills.',
  },
  {
    customerEmail: 'customer3@atithi.com',
    restaurantName: 'Kuroshio Teppan & Sushi',
    rating: 5,
    comment: 'Impeccable pacing from the chef and smoky charcoal yakitori skewers.',
  },
  {
    customerEmail: 'customer5@atithi.com',
    restaurantName: 'Kuroshio Teppan & Sushi',
    rating: 4,
    comment: 'Top-notch presentation and calm atmosphere. On the pricey side, yet memorable for celebrations.',
  },
  {
    customerEmail: 'customer2@atithi.com',
    restaurantName: 'Dakshin Spice & Curry',
    rating: 5,
    comment: 'The Malabar coconut curry and soft appams tasted deeply authentic and vibrant.',
  },
  {
    customerEmail: 'customer4@atithi.com',
    restaurantName: 'Dakshin Spice & Curry',
    rating: 4,
    comment: 'Great spice balance and plenty of creative vegetarian choices near HITEC City.',
  },
  {
    customerEmail: 'customer6@atithi.com',
    restaurantName: 'Dakshin Spice & Curry',
    rating: 3,
    comment: 'Loved the crispy curry-leaf starter, though our main course took a little while during lunch rush.',
  },
  {
    customerEmail: 'customer1@atithi.com',
    restaurantName: 'Concu Boulangerie & Bistro',
    rating: 4,
    comment: 'Flakiest almond croissants in Film Nagar and a sunlit patio ideal for weekend coffee.',
  },
  {
    customerEmail: 'customer5@atithi.com',
    restaurantName: 'Concu Boulangerie & Bistro',
    rating: 5,
    comment: 'Brioche French toast and hazelnut tart were spot-on. Wonderful service.',
  },
  {
    customerEmail: 'customer6@atithi.com',
    restaurantName: 'Concu Boulangerie & Bistro',
    rating: 2,
    comment: 'Desserts are delicious, but Sunday morning wait times stretched past 40 minutes.',
  },
  {
    customerEmail: 'customer2@atithi.com',
    restaurantName: 'Toscana Trattoria',
    rating: 5,
    comment: 'Handmade pasta and wood-fired sourdough pizza right on Road No. 45. Zero shortcuts in the kitchen.',
  },
  {
    customerEmail: 'customer3@atithi.com',
    restaurantName: 'Toscana Trattoria',
    rating: 5,
    comment: 'Lovely evening garden lighting and rich burrata margherita pizza.',
  },
  {
    customerEmail: 'customer5@atithi.com',
    restaurantName: 'Toscana Trattoria',
    rating: 4,
    comment: 'Great tiramisu and thin-crust pizzas. Definitely reserve ahead for Saturday dinner.',
  },
  {
    customerEmail: 'customer4@atithi.com',
    restaurantName: 'Charminar Darbar & Kebabs',
    rating: 5,
    comment: 'Patthar ka gosht and Irani chai after dinner near Charminar was unforgettable.',
  },
  {
    customerEmail: 'customer6@atithi.com',
    restaurantName: 'Charminar Darbar & Kebabs',
    rating: 4,
    comment: 'Classic Old City flavors, generous portions, and warm hospitality.',
  },
  {
    customerEmail: 'customer1@atithi.com',
    restaurantName: 'Seoul Ember BBQ',
    rating: 5,
    comment: 'Clean smokeless grills, wonderfully marinated barbecue, and crisp kimchi in Gachibowli.',
  },
  {
    customerEmail: 'customer2@atithi.com',
    restaurantName: 'Seoul Ember BBQ',
    rating: 3,
    comment: 'Good meat quality and fun vibe, though portions felt slightly modest for the price.',
  },
  {
    customerEmail: 'customer3@atithi.com',
    restaurantName: 'Siam Lotus Street Kitchen',
    rating: 5,
    comment: 'Incredible wok hei on the pad see ew! Fast, affordable, and bursting with fresh Thai basil in Madhapur.',
  },
  {
    customerEmail: 'customer5@atithi.com',
    restaurantName: 'Siam Lotus Street Kitchen',
    rating: 4,
    comment: 'My go-to spot near 100 Feet Road for aromatic green curry on rainy evenings.',
  },
  {
    customerEmail: 'customer6@atithi.com',
    restaurantName: 'Siam Lotus Street Kitchen',
    rating: 1,
    comment: 'My takeaway order missed an item and the spice level was far hotter than requested.',
  },
  {
    customerEmail: 'customer2@atithi.com',
    restaurantName: 'Koyla Charcoal Grill',
    rating: 5,
    comment: 'Creamy dal makhani and smoky paneer tikka under the Kondapur night sky!',
  },
  {
    customerEmail: 'customer4@atithi.com',
    restaurantName: 'Koyla Charcoal Grill',
    rating: 4,
    comment: 'Generous tandoor platters and soft garlic naans.',
  },
  {
    customerEmail: 'customer3@atithi.com',
    restaurantName: 'Olive & Courtyard Kitchen',
    rating: 4,
    comment: 'Whipped feta dip and warm wood-fired pita in Begumpet felt refined yet welcoming.',
  },
  {
    customerEmail: 'customer6@atithi.com',
    restaurantName: 'Olive & Courtyard Kitchen',
    rating: 5,
    comment: 'Thoughtful Mediterranean menu with attentive staff and lovely desserts.',
  },
];

const seedDatabase = async () => {
  const userMap = new Map();

  for (const userData of SEED_USERS) {
    let user = await User.findOne({ email: userData.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        role: userData.role,
        isActive: true,
        isEmailVerified: true,
      });
    } else if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }
    userMap.set(user.email, user);
  }

  const restaurantMap = new Map();

  for (const restData of SEED_RESTAURANTS) {
    const ownerUser = restData.ownerEmail ? userMap.get(restData.ownerEmail) : null;
    let restaurant = await Restaurant.findOne({ name: restData.name });

    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: restData.name,
        description: restData.description,
        location: restData.location,
        address: restData.address,
        cuisine: restData.cuisine,
        image: restData.image,
        phone: restData.phone,
        priceRange: restData.priceRange,
        owner: ownerUser ? ownerUser._id : null,
        isActive: true,
      });
    } else if (ownerUser && !restaurant.owner) {
      restaurant.owner = ownerUser._id;
      await restaurant.save();
    }

    restaurantMap.set(restaurant.name, restaurant);
  }

  let createdReviews = 0;
  for (const revData of SEED_REVIEWS) {
    const customer = userMap.get(revData.customerEmail);
    const restaurant = restaurantMap.get(revData.restaurantName);
    if (!customer || !restaurant) continue;

    const existing = await Review.findOne({
      customer: customer._id,
      restaurant: restaurant._id,
    });

    if (!existing) {
      await Review.create({
        customer: customer._id,
        restaurant: restaurant._id,
        rating: revData.rating,
        comment: revData.comment,
      });
      createdReviews += 1;
    }
  }

  return {
    usersCount: userMap.size,
    restaurantsCount: restaurantMap.size,
    newReviewsCount: createdReviews,
  };
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      const summary = await seedDatabase();
      console.log('Database seeded successfully:', summary);
      await mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      console.error('Seed script failed:', error);
      await mongoose.connection.close().catch(() => {});
      process.exit(1);
    }
  })();
}

module.exports = {
  seedDatabase,
  SEED_USERS,
  SEED_RESTAURANTS,
  SEED_REVIEWS,
};
