// Mock Demo Data for Guest/Demo Mode of the Wedding Expense Tracker

export const demoWedding = {
  _id: "demo-wedding-123",
  weddingName: "Pooja & Rahul's Royal Wedding",
  totalBudget: 1500000,
  weddingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
  userId: { name: "Pooja Sharma", email: "pooja@example.com" },
  members: [
    { _id: "m1", user: { name: "Rahul Verma" }, role: "Editor" },
    { _id: "m2", user: { name: "Aman Sharma" }, role: "Viewer" }
  ]
};

export const demoExpenses = [
  {
    _id: "e1",
    category: "Venue",
    amount: 500000,
    expenseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    vendor: "Grand Palace Resort",
    addedBy: { name: "Pooja Sharma" },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "e2",
    category: "Catering",
    amount: 350000,
    expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    vendor: "Royal Flavors Catering",
    addedBy: { name: "Rahul Verma" },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "e3",
    category: "Decor",
    amount: 150000,
    expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "Cash",
    paymentStatus: "Partially Paid",
    vendor: "Dream Bloom Florists",
    addedBy: { name: "Pooja Sharma" },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "e4",
    category: "Photography",
    amount: 120000,
    expenseDate: new Date().toISOString(),
    paymentMethod: "Bank Transfer",
    paymentStatus: "Pending",
    vendor: "LensCraft Studio",
    addedBy: { name: "Aman Sharma" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "e5",
    category: "Attire",
    amount: 80000,
    expenseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    vendor: "Sabyasachi Heritage Boutique",
    addedBy: { name: "Pooja Sharma" },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "e6",
    category: "Music & DJ",
    amount: 60000,
    expenseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "UPI",
    paymentStatus: "Partially Paid",
    vendor: "DJ Vicky Beats",
    addedBy: { name: "Rahul Verma" },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "e7",
    category: "Invitations",
    amount: 25000,
    expenseDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    vendor: "Golden Card Printers",
    addedBy: { name: "Pooja Sharma" },
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const demoVendors = [
  {
    _id: "v1",
    vendorName: "Grand Palace Resort",
    serviceType: "Venue",
    contactNumber: "+91 98765 43210",
    totalAmount: 500000,
    advancePaid: 500000,
    remainingAmount: 0,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "v2",
    vendorName: "Royal Flavors Catering",
    serviceType: "Catering",
    contactNumber: "+91 98765 88990",
    totalAmount: 450000,
    advancePaid: 350000,
    remainingAmount: 100000,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "v3",
    vendorName: "Dream Bloom Florists",
    serviceType: "Decor",
    contactNumber: "+91 98123 45678",
    totalAmount: 250000,
    advancePaid: 150000,
    remainingAmount: 100000,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "v4",
    vendorName: "LensCraft Studio",
    serviceType: "Photography",
    contactNumber: "+91 95432 10987",
    totalAmount: 200000,
    advancePaid: 80000,
    remainingAmount: 120000,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "v5",
    vendorName: "DJ Vicky Beats",
    serviceType: "Music & Entertainment",
    contactNumber: "+91 90011 22334",
    totalAmount: 100000,
    advancePaid: 60000,
    remainingAmount: 40000,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const demoGuests = [
  {
    _id: "g1",
    name: "Amit Sharma",
    email: "amit@example.com",
    phone: "+91 99887 76655",
    side: "Bride",
    rsvpStatus: "Confirmed",
    numberOfPlates: 3,
    events: ["Haldi", "Wedding", "Reception"],
    addedBy: { name: "Pooja Sharma" }
  },
  {
    _id: "g2",
    name: "Dr. Ramesh Verma",
    email: "ramesh@example.com",
    phone: "+91 98761 12233",
    side: "Groom",
    rsvpStatus: "Confirmed",
    numberOfPlates: 2,
    events: ["Wedding", "Reception"],
    addedBy: { name: "Rahul Verma" }
  },
  {
    _id: "g3",
    name: "Neha Gupta",
    email: "neha@example.com",
    phone: "+91 95555 44433",
    side: "Bride",
    rsvpStatus: "Pending",
    numberOfPlates: 1,
    events: ["Mehendi", "Sangeet", "Wedding"],
    addedBy: { name: "Pooja Sharma" }
  },
  {
    _id: "g4",
    name: "Rajesh Malhotra",
    email: "rajesh@example.com",
    phone: "+91 94444 33322",
    side: "Groom",
    rsvpStatus: "Declined",
    numberOfPlates: 0,
    events: [],
    addedBy: { name: "Rahul Verma" }
  },
  {
    _id: "g5",
    name: "Sneha Patel",
    email: "sneha@example.com",
    phone: "+91 91111 22233",
    side: "Both",
    rsvpStatus: "Confirmed",
    numberOfPlates: 4,
    events: ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"],
    addedBy: { name: "Pooja Sharma" }
  }
];

export const demoEvents = [
  {
    _id: "ev1",
    name: "Haldi",
    date: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000).toISOString(),
    eventTime: "10:00 AM",
    venue: "Sharma Villa Banquet",
    budget: 50000,
    notes: "Traditional Haldi followed by lunch. Yellow dress code.",
    addedBy: { name: "Pooja Sharma" }
  },
  {
    _id: "ev2",
    name: "Sangeet",
    date: new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString(),
    eventTime: "06:00 PM",
    venue: "Royal Grand Banquet Hall",
    budget: 200000,
    notes: "An evening of dance, music, and mehendi designs. Indo-western dress code.",
    addedBy: { name: "Rahul Verma" }
  },
  {
    _id: "ev3",
    name: "Wedding",
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    eventTime: "07:00 PM",
    venue: "Grand Palace Lawn",
    budget: 800000,
    notes: "Baraat assembly followed by Varmala & traditional Phere ceremony. Festive ethnic wear.",
    addedBy: { name: "Pooja Sharma" }
  },
  {
    _id: "ev4",
    name: "Reception",
    date: new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString(),
    eventTime: "08:00 PM",
    venue: "Royal Crystal Ballroom",
    budget: 300000,
    notes: "Formal dinner reception and cake cutting. Formal tuxedo / gown dress code.",
    addedBy: { name: "Rahul Verma" }
  }
];
