export type ProductTag = "New" | "Best Seller" | "Limited" | "Sale";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  colors: string[];
  sizes: string[];
  stock: number;
  tags: ProductTag[];
  description: string;
};

export const categoryChips = [
  "Home Furniture",
  "Accent Chairs",
  "Coffee Tables",
  "Sofas",
  "Lighting",
  "Wall Decor"
];

export const products: Product[] = [
  {
    id: "p-1",
    slug: "velour-arc-sofa",
    name: "Velour Arc Sofa",
    price: 9400,
    compareAt: 10100,
    rating: 4.9,
    reviews: 84,
    image:
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1400&q=80",
    category: "Sofas",
    colors: ["Midnight Blue", "Champagne Beige"],
    sizes: ["2-Seater", "3-Seater"],
    stock: 6,
    tags: ["Best Seller"],
    description: "A sculpted velvet profile with deep comfort and quiet elegance."
  },
  {
    id: "p-2",
    slug: "santorini-marble-table",
    name: "Santorini Marble Coffee Table",
    price: 6200,
    rating: 4.8,
    reviews: 42,
    image:
      "https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=1400&q=80",
    category: "Coffee Tables",
    colors: ["Ivory Stone"],
    sizes: ["120cm"],
    stock: 11,
    tags: ["New"],
    description: "Italian-inspired marble top with brushed brass base details."
  },
  {
    id: "p-3",
    slug: "luna-wing-chair",
    name: "Luna Wing Accent Chair",
    price: 3800,
    rating: 4.7,
    reviews: 58,
    image:
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1400&q=80",
    category: "Accent Chairs",
    colors: ["Warm Taupe", "Olive"],
    sizes: ["Single"],
    stock: 3,
    tags: ["Limited"],
    description: "Contoured wing profile designed for statement corners."
  },
  {
    id: "p-4",
    slug: "aurum-floor-lamp",
    name: "Aurum Floor Lamp",
    price: 2100,
    compareAt: 2400,
    rating: 4.6,
    reviews: 31,
    image:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=80",
    category: "Lighting",
    colors: ["Matte Gold"],
    sizes: ["180cm"],
    stock: 15,
    tags: ["Sale"],
    description: "Soft ambient glow with an elevated metal finish."
  },
  {
    id: "p-5",
    slug: "casa-arch-console",
    name: "Casa Arch Console",
    price: 4700,
    rating: 4.9,
    reviews: 40,
    image:
      "https://images.unsplash.com/photo-1616627452099-ecfdd6f8cb9f?auto=format&fit=crop&w=1400&q=80",
    category: "Home Furniture",
    colors: ["Walnut"],
    sizes: ["140cm"],
    stock: 7,
    tags: ["Best Seller"],
    description: "Slim entryway statement piece with curved architecture."
  },
  {
    id: "p-6",
    slug: "viento-ottoman",
    name: "Viento Plush Ottoman",
    price: 1600,
    rating: 4.5,
    reviews: 19,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    category: "Home Furniture",
    colors: ["Sand"],
    sizes: ["Standard"],
    stock: 20,
    tags: ["New"],
    description: "A soft-edge ottoman for layered living room styling."
  }
];

export const homeCollections = [
  { title: "New Arrivals", subtitle: "Freshly curated pieces for refined homes." },
  { title: "Best Sellers", subtitle: "Most-loved furniture selected by our clients." }
];

export const testimonials = [
  {
    name: "Nana O.",
    quote: "Every detail felt intentional. The sofa elevated my entire living room."
  },
  {
    name: "Afi M.",
    quote: "Luxury that feels warm and livable. Delivery was smooth and professional."
  },
  {
    name: "Esi B.",
    quote: "Quietly stunning pieces. Luxxelounge really understands modern elegance."
  }
];
