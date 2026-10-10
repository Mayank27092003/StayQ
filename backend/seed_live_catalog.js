const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING PRODUCTION DATABASE (CLOUD SQL) ---');

  // 1. Ensure Host User exists and is APPROVED
  let host = await prisma.user.findFirst({
    where: { roles: { has: 'HOST' } },
  });

  if (!host) {
    host = await prisma.user.create({
      data: {
        firebaseUid: 'stayq_official_host',
        displayName: 'StayQ Superhost & Experience Curator',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'Certified luxury host & local culture enthusiast on StayQ. Dedicated to authentic, high-touch hospitality.',
        roles: ['HOST', 'GUEST'],
        isSuperhost: true,
        isStarhost: true,
        isHostVerified: true,
        hostStatus: 'APPROVED',
      },
    });
  } else {
    await prisma.user.update({
      where: { id: host.id },
      data: {
        hostStatus: 'APPROVED',
        isSuperhost: true,
        isStarhost: true,
      },
    });
  }

  console.log('Host configured:', host.id, host.displayName);

  // 2. Activate all existing Properties
  const updatedProps = await prisma.property.updateMany({
    data: {
      status: 'ACTIVE',
      hostId: host.id,
    },
  });
  console.log('Activated existing properties:', updatedProps.count);

  // 3. Delete old test experiences if any, to ensure clean, accurate catalog
  await prisma.experienceSlot.deleteMany({});
  await prisma.experienceImage.deleteMany({});
  await prisma.experience.deleteMany({});

  // 4. Seed 6 authentic experiences across Goa, Manali, Udaipur, Varkala
  const experiencesData = [
    {
      title: 'Traditional Goan Cooking Masterclass & Spice Garden Trail',
      description: 'Step into an ancestral Portuguese villa in Goa. Learn secret Goan fish curry, cafreal, and bebinca recipes from a 3rd-generation chef. We harvest fresh organic spices directly from the estate before cooking over clay pots.',
      category: 'FOOD_AND_DRINK',
      city: 'Goa',
      location: 'Panaji & Divar Island, Goa',
      durationMinutes: 180,
      maxGroupSize: 10,
      pricePerPerson: 1200,
      transportOption: 'PICKUP_DROP',
      foodIncluded: true,
      equipmentIncluded: true,
      kidsFreeAgeLimit: 5,
      scheduleTime: '12:00 PM - 03:00 PM',
      includes: [
        'Complimentary pickup & drop from Panaji & North Goa beaches',
        'Multi-course authentic Goan feast with Kokum drinks',
        'Chef apron, recipe booklet & spice souvenir pack',
        'Kids up to 5 years participate completely free'
      ],
      whatToBring: ['Comfortable walking shoes', 'Sun hat', 'Appetite for local spices'],
      lat: 15.5033,
      lng: 73.8821,
      images: [
        'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=80'
      ],
      slots: [
        { startTime: '12:00 PM', spotsTotal: 10, spotsTaken: 1 },
        { startTime: '04:00 PM', spotsTotal: 10, spotsTaken: 2 },
      ]
    },
    {
      title: 'Sunset Mangrove Kayaking & Bioluminescence Trail',
      description: 'Paddle through serene backwater channels in Chorao island. Glide beneath lush mangrove canopies as the sunset paints the Mandovi river in gold, followed by twilight bioluminescence sighting under star-lit skies.',
      category: 'ADVENTURE',
      city: 'Goa',
      location: 'Chorao Island, North Goa',
      durationMinutes: 150,
      maxGroupSize: 8,
      pricePerPerson: 999,
      transportOption: 'SELF_ARRIVE',
      foodIncluded: true,
      equipmentIncluded: true,
      kidsFreeAgeLimit: 7,
      scheduleTime: '04:30 PM - 07:00 PM',
      includes: [
        'Pro sea-touring kayaks, carbon fiber paddles & life vests',
        'Certified wilderness kayak guide & safety rescue boat',
        'Evening Goan tea, poi snacks & hydration',
        'High-resolution GoPro photos and drone clip'
      ],
      whatToBring: ['Dry clothes', 'Waterproof phone pouch', 'Mosquito repellent'],
      lat: 15.5412,
      lng: 73.8687,
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&q=80'
      ],
      slots: [
        { startTime: '04:30 PM', spotsTotal: 8, spotsTaken: 1 },
      ]
    },
    {
      title: 'Old Manali Apple Orchard Cider Tasting & Woodfired Baking',
      description: 'Trek into private high-altitude apple orchards overlooking the snow-capped Rohtang peaks. Press your own natural mountain cider, bake woodfired Himachali trout and sourdough bread, and learn local pahadi folklore around a warm stone fire pit.',
      category: 'FOOD_AND_DRINK',
      city: 'Manali',
      location: 'Old Manali Orchards, Himachal Pradesh',
      durationMinutes: 180,
      maxGroupSize: 12,
      pricePerPerson: 850,
      transportOption: 'SELF_ARRIVE',
      foodIncluded: true,
      equipmentIncluded: true,
      kidsFreeAgeLimit: 6,
      scheduleTime: '01:00 PM - 04:00 PM',
      includes: [
        'Artisan cider pressing and tasting flight',
        'Woodfired bread & smoked mountain cheese platter',
        'Guided orchard tour with botanist host',
        'Kids under 6 attend completely free'
      ],
      whatToBring: ['Warm mountain jacket', 'Sturdy walking shoes', 'Sunglasses'],
      lat: 32.2562,
      lng: 77.1856,
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80'
      ],
      slots: [
        { startTime: '01:00 PM', spotsTotal: 12, spotsTaken: 3 },
      ]
    },
    {
      title: 'Solang Valley High-Altitude Tandem Paragliding & 4K Aerial Cam',
      description: 'Soar 2,000 feet above the pine forests of Solang Valley with a certified Himalayan aviator. Unrivaled panoramic vistas of Dhauladhar ranges, Pir Panjal, and Beas river basin.',
      category: 'SPORTS',
      city: 'Manali',
      location: 'Solang Valley, Manali, Himachal Pradesh',
      durationMinutes: 120,
      maxGroupSize: 6,
      pricePerPerson: 2500,
      transportOption: 'PICKUP_DROP',
      foodIncluded: false,
      equipmentIncluded: true,
      kidsFreeAgeLimit: 0,
      scheduleTime: '10:00 AM - 12:00 PM',
      includes: [
        'Mall Road / Hotel pickup & 4x4 mountain transfer',
        'International certified tandem harness & reserve parachute',
        '4K 60fps GoPro video on your mobile phone instantly',
        'National adventure insurance coverage included'
      ],
      whatToBring: ['Windproof jacket', 'Sneakers with good grip', 'Gloves in winter'],
      lat: 32.3166,
      lng: 77.1569,
      images: [
        'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1200&q=80'
      ],
      slots: [
        { startTime: '10:00 AM', spotsTotal: 6, spotsTaken: 1 },
      ]
    },
    {
      title: 'Lake Pichola Royal Heritage Sunset Boat Tour & Mewari Storytelling',
      description: 'Exclusive chartered wooden royal boat on Lake Pichola. Cruise past Jag Mandir, Taj Lake Palace, and City Palace while a resident royal historian narrates forgotten legends of Mewar chivalry over royal saffron kehwa.',
      category: 'ART_AND_CULTURE',
      city: 'Udaipur',
      location: 'Lake Pichola, Udaipur, Rajasthan',
      durationMinutes: 120,
      maxGroupSize: 10,
      pricePerPerson: 1500,
      transportOption: 'PICKUP_DROP',
      foodIncluded: true,
      equipmentIncluded: true,
      kidsFreeAgeLimit: 5,
      scheduleTime: '04:30 PM - 06:30 PM',
      includes: [
        'VIP private boat cruise on Lake Pichola',
        'Royal saffron kehwa tea, kachoris & dry fruit sweets',
        'Private licensed historian and folk music artist',
        'Free entrance for children up to 5 years old'
      ],
      whatToBring: ['Camera', 'Light shawl for evening breeze', 'Valid photo ID'],
      lat: 24.5764,
      lng: 73.6806,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80'
      ],
      slots: [
        { startTime: '04:30 PM', spotsTotal: 10, spotsTaken: 2 },
      ]
    },
    {
      title: 'Varkala Clifftop Sunset Yoga, Sound Bath & Ayurvedic Elixirs',
      description: 'Experience deep rejuvenation on the sacred red laterite cliffs of Varkala overlooking the Arabian Sea. Gentle Hatha yoga, Tibetan singing bowl sound healing, and custom Ayurvedic botanical drinks prepared by an in-house vaidya.',
      category: 'WELLNESS',
      city: 'Varkala',
      location: 'North Cliff, Varkala, Kerala',
      durationMinutes: 120,
      maxGroupSize: 15,
      pricePerPerson: 700,
      transportOption: 'SELF_ARRIVE',
      foodIncluded: true,
      equipmentIncluded: true,
      kidsFreeAgeLimit: 10,
      scheduleTime: '05:00 PM - 07:00 PM',
      includes: [
        'Organic cotton yoga mats, cork blocks & meditation cushions',
        'Full 45-minute sound healing immersion with 7 chakra bowls',
        'Fresh coconut water & signature Ayurvedic herbal elixirs',
        'Young learners up to 10 years free with accompanying parent'
      ],
      whatToBring: ['Breathable yoga clothing', 'Personal water bottle', 'Positive energy'],
      lat: 8.7379,
      lng: 76.7027,
      images: [
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80'
      ],
      slots: [
        { startTime: '05:00 PM', spotsTotal: 15, spotsTaken: 4 },
      ]
    }
  ];

  for (const exp of experiencesData) {
    const createdExp = await prisma.experience.create({
      data: {
        hostId: host.id,
        title: exp.title,
        description: exp.description,
        category: exp.category,
        city: exp.city,
        location: exp.location,
        durationMinutes: exp.durationMinutes,
        maxGroupSize: exp.maxGroupSize,
        pricePerPerson: exp.pricePerPerson,
        transportOption: exp.transportOption,
        foodIncluded: exp.foodIncluded,
        equipmentIncluded: exp.equipmentIncluded,
        kidsFreeAgeLimit: exp.kidsFreeAgeLimit,
        scheduleTime: exp.scheduleTime,
        includes: exp.includes,
        whatToBring: exp.whatToBring,
        lat: exp.lat,
        lng: exp.lng,
        status: 'ACTIVE',
        images: {
          create: exp.images.map((url, order) => ({ url, order })),
        },
      },
    });

    // Create slots for the next 14 days
    const now = new Date();
    for (let day = 0; day < 14; day++) {
      const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day);
      for (const slotTemplate of exp.slots) {
        await prisma.experienceSlot.create({
          data: {
            experienceId: createdExp.id,
            date: slotDate,
            startTime: slotTemplate.startTime,
            spotsTotal: slotTemplate.spotsTotal,
            spotsTaken: day === 0 ? slotTemplate.spotsTaken : Math.floor(Math.random() * 3),
          },
        });
      }
    }

    console.log(`Created Experience in DB: [${exp.city}] "${exp.title}" (ID: ${createdExp.id})`);
  }

  const finalExpCount = await prisma.experience.count();
  const finalPropCount = await prisma.property.count({ where: { status: 'ACTIVE' } });
  console.log(`\nDONE! Active Properties in DB: ${finalPropCount}, Active Experiences in DB: ${finalExpCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
